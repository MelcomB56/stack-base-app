FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
COPY main.go .
RUN go build -o stackbase-agent .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/stackbase-agent /stackbase-agent
EXPOSE 9101
ENTRYPOINT ["/stackbase-agent"]
