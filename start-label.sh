#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID=""
CLIENT_PID=""
BACKEND_URL="http://127.0.0.1:5001/docs"
# Sample image download can take a long time on a flaky network.
BACKEND_WAIT_TIMEOUT_S="${BACKEND_WAIT_TIMEOUT_S:-3600}"

cleanup() {
	echo ""
	echo "Stopping servers..."
	if [[ -n "${CLIENT_PID}" ]] && kill -0 "${CLIENT_PID}" 2>/dev/null; then
		kill "${CLIENT_PID}" 2>/dev/null || true
	fi
	if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
		kill "${BACKEND_PID}" 2>/dev/null || true
	fi
	wait 2>/dev/null || true
	echo "Servers stopped"
	exit 0
}
trap cleanup SIGINT SIGTERM

wait_for_backend() {
	local elapsed=0
	echo "Waiting for image setup to finish and backend to listen on ${BACKEND_URL}..."
	while (( elapsed < BACKEND_WAIT_TIMEOUT_S )); do
		if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
			echo "❌ Backend exited before becoming ready (setup may have failed)."
			wait "${BACKEND_PID}" || true
			exit 1
		fi
		if curl -sf --max-time 2 "${BACKEND_URL}" -o /dev/null 2>/dev/null; then
			echo "✅ Backend is ready."
			return 0
		fi
		sleep 2
		elapsed=$((elapsed + 2))
	done
	echo "❌ Timed out waiting for backend after ${BACKEND_WAIT_TIMEOUT_S}s."
	exit 1
}

echo "Starting Image Taxonomy Labeling Interface..."
echo "Starting backend (deps → sample setup → API) on http://127.0.0.1:5001..."
bash "${ROOT_DIR}/server/start.sh" &
BACKEND_PID=$!

wait_for_backend

echo "Starting apps/label on http://localhost:3333..."
bash "${ROOT_DIR}/apps/label/start.sh" &
CLIENT_PID=$!

echo "Frontend: http://localhost:3333"
echo "Backend API: http://127.0.0.1:5001"
echo "Press Ctrl+C to stop both servers."

wait "${BACKEND_PID}" "${CLIENT_PID}"
