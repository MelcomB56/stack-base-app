import Image from "next/image";

export default function Home() {
  return (
    <main
      style={{
        margin: 0,
        padding: 0,
        background: "#04091A",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/coming-soon.jpg"
        alt="Stack-Base — Coming Soon"
        width={1536}
        height={864}
        priority
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </main>
  );
}
