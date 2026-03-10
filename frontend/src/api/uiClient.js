import axios from "axios";

export async function runUiScan(url, outDir) {
  return axios.post("http://localhost:3000/run-ui", {
    url,
    outDir
  });
}
