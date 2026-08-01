// stackbase-agent — leichtgewichtiger Monitoring-Agent für Stack-Base
// Deploye auf einem beliebigen Server; Stack-Base fragt GET /metrics ab.
//
// Env-Variablen:
//   SB_API_KEY   Token (wird beim Start generiert wenn nicht gesetzt)
//   SB_PORT      HTTP-Port (Standard: 9101)
//   SB_CONTAINER Docker-Container-Name (optional; aktiviert Docker-Modus)
package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Metrics struct {
	CPU        float64 `json:"cpu"`
	MemUsed    int64   `json:"memUsed"`
	MemTotal   int64   `json:"memTotal"`
	MemPercent float64 `json:"memPercent"`
	NetIn      int64   `json:"netIn"`
	NetOut     int64   `json:"netOut"`
	Source     string  `json:"source"`
	Container  *string `json:"container,omitempty"`
}

type dockerStats struct {
	CPUStats struct {
		CPUUsage       struct{ TotalUsage uint64 `json:"total_usage"` } `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
		OnlineCPUs     int    `json:"online_cpus"`
	} `json:"cpu_stats"`
	PreCPUStats struct {
		CPUUsage       struct{ TotalUsage uint64 `json:"total_usage"` } `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
	} `json:"precpu_stats"`
	MemoryStats struct {
		Usage uint64 `json:"usage"`
		Limit uint64 `json:"limit"`
		Stats struct {
			Cache        uint64 `json:"cache"`
			InactiveFile uint64 `json:"inactive_file"`
		} `json:"stats"`
	} `json:"memory_stats"`
	Networks map[string]struct {
		RxBytes uint64 `json:"rx_bytes"`
		TxBytes uint64 `json:"tx_bytes"`
	} `json:"networks"`
}

// ─── Globals ──────────────────────────────────────────────────────────────────

var (
	apiKey          string
	containerName   string
	dockerAvailable bool
)

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	apiKey = os.Getenv("SB_API_KEY")
	if apiKey == "" {
		b := make([]byte, 24)
		if _, err := rand.Read(b); err != nil {
			log.Fatal("cannot generate API key:", err)
		}
		apiKey = "sb_" + hex.EncodeToString(b)
	}

	containerName = os.Getenv("SB_CONTAINER")
	port := os.Getenv("SB_PORT")
	if port == "" {
		port = "9101"
	}

	if _, err := os.Stat("/var/run/docker.sock"); err == nil {
		dockerAvailable = true
	}

	mode := "System (/proc)"
	if dockerAvailable && containerName != "" {
		mode = fmt.Sprintf("Docker (container: %s)", containerName)
	} else if dockerAvailable {
		mode = "System — Docker verfügbar, aber SB_CONTAINER nicht gesetzt"
	}

	fmt.Println()
	fmt.Println("====================================")
	fmt.Println("  Stack-Base Agent v1.0")
	fmt.Println("====================================")
	fmt.Printf("  Port:  :%s\n", port)
	fmt.Printf("  Mode:  %s\n", mode)
	fmt.Printf("  Token: %s\n", apiKey)
	fmt.Println("====================================")
	fmt.Println()
	fmt.Println("In Stack-Base eintragen:")
	fmt.Printf("  Agent URL:   http://<SERVER_IP>:%s\n", port)
	fmt.Printf("  Agent Token: %s\n\n", apiKey)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`))
	})
	mux.HandleFunc("/metrics", handleMetrics)

	log.Printf("[stackbase-agent] listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Authorization") != "Bearer "+apiKey {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	var (
		m   Metrics
		err error
	)
	if dockerAvailable && containerName != "" {
		m, err = getDockerMetrics(containerName)
		if err != nil {
			log.Printf("[docker] %v — fallback to system", err)
			m, err = getSystemMetrics()
		}
	} else {
		m, err = getSystemMetrics()
	}

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"error":%q}`, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

// ─── Docker Metrics ───────────────────────────────────────────────────────────

func dockerHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				return (&net.Dialer{}).DialContext(ctx, "unix", "/var/run/docker.sock")
			},
		},
	}
}

func getDockerMetrics(container string) (Metrics, error) {
	url := fmt.Sprintf("http://localhost/containers/%s/stats?stream=false", container)
	resp, err := dockerHTTPClient().Get(url)
	if err != nil {
		return Metrics{}, fmt.Errorf("docker stats: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == 404 {
		return Metrics{}, fmt.Errorf("container %q not found", container)
	}

	var s dockerStats
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return Metrics{}, fmt.Errorf("docker stats JSON: %w", err)
	}

	// CPU %
	cpuDelta := float64(s.CPUStats.CPUUsage.TotalUsage) - float64(s.PreCPUStats.CPUUsage.TotalUsage)
	sysDelta := float64(s.CPUStats.SystemCPUUsage) - float64(s.PreCPUStats.SystemCPUUsage)
	numCPUs := s.CPUStats.OnlineCPUs
	if numCPUs == 0 {
		numCPUs = 1
	}
	var cpu float64
	if sysDelta > 0 {
		cpu = (cpuDelta / sysDelta) * float64(numCPUs) * 100
	}

	// RAM — inactive_file abziehen (entspricht "docker stats"-Darstellung)
	cache := s.MemoryStats.Stats.InactiveFile
	if cache == 0 {
		cache = s.MemoryStats.Stats.Cache
	}
	memUsed := int64(s.MemoryStats.Usage)
	if int64(cache) < memUsed {
		memUsed -= int64(cache)
	}
	memTotal := int64(s.MemoryStats.Limit)
	var memPct float64
	if memTotal > 0 {
		memPct = float64(memUsed) / float64(memTotal) * 100
	}

	// Netzwerk — alle Interfaces summieren
	var netIn, netOut int64
	for _, iface := range s.Networks {
		netIn += int64(iface.RxBytes)
		netOut += int64(iface.TxBytes)
	}

	c := container
	return Metrics{
		CPU: cpu, MemUsed: memUsed, MemTotal: memTotal, MemPercent: memPct,
		NetIn: netIn, NetOut: netOut, Source: "docker", Container: &c,
	}, nil
}

// ─── System Metrics (/proc) ───────────────────────────────────────────────────

type cpuTimes struct{ idle, total uint64 }

func readCPU() (cpuTimes, error) {
	f, err := os.Open("/proc/stat")
	if err != nil {
		return cpuTimes{}, err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "cpu ") {
			continue
		}
		fields := strings.Fields(line)
		u := func(i int) uint64 {
			if i < len(fields) {
				v, _ := strconv.ParseUint(fields[i], 10, 64)
				return v
			}
			return 0
		}
		idle := u(4) + u(5)
		total := u(1) + u(2) + u(3) + u(4) + u(5) + u(6) + u(7) + u(8)
		return cpuTimes{idle: idle, total: total}, nil
	}
	return cpuTimes{}, fmt.Errorf("/proc/stat: cpu line not found")
}

func getSystemMetrics() (Metrics, error) {
	t1, err := readCPU()
	if err != nil {
		return Metrics{}, err
	}
	time.Sleep(200 * time.Millisecond)
	t2, err := readCPU()
	if err != nil {
		return Metrics{}, err
	}

	totalDelta := float64(t2.total - t1.total)
	idleDelta := float64(t2.idle - t1.idle)
	var cpu float64
	if totalDelta > 0 {
		cpu = (1 - idleDelta/totalDelta) * 100
	}

	memInfo := readMemInfo()
	memTotal := int64(memInfo["MemTotal"]) * 1024
	memAvail := int64(memInfo["MemAvailable"]) * 1024
	if memAvail == 0 {
		memAvail = int64(memInfo["MemFree"]) * 1024
	}
	memUsed := memTotal - memAvail
	var memPct float64
	if memTotal > 0 {
		memPct = float64(memUsed) / float64(memTotal) * 100
	}

	netIn, netOut := readNetDev()

	return Metrics{
		CPU: cpu, MemUsed: memUsed, MemTotal: memTotal, MemPercent: memPct,
		NetIn: netIn, NetOut: netOut, Source: "system",
	}, nil
}

func readMemInfo() map[string]uint64 {
	result := make(map[string]uint64)
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return result
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		parts := strings.SplitN(scanner.Text(), ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		valStr := strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(parts[1]), "kB"))
		val, _ := strconv.ParseUint(valStr, 10, 64)
		result[key] = val
	}
	return result
}

func readNetDev() (int64, int64) {
	f, err := os.Open("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	defer f.Close()

	var rx, tx int64
	scanner := bufio.NewScanner(f)
	scanner.Scan() // Header-Zeile 1
	scanner.Scan() // Header-Zeile 2
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		idx := strings.Index(line, ":")
		if idx < 0 {
			continue
		}
		iface := strings.TrimSpace(line[:idx])
		if iface == "lo" {
			continue
		}
		fields := strings.Fields(line[idx+1:])
		if len(fields) < 9 {
			continue
		}
		r, _ := strconv.ParseInt(fields[0], 10, 64)
		t, _ := strconv.ParseInt(fields[8], 10, 64)
		rx += r
		tx += t
	}
	return rx, tx
}
