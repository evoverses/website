import net from "net";

export const checkNetConnection = async (
  host: string,
  port: number,
  timeout: number = 5_000,
) => new Promise((resolve, reject) => {
  const address = `${host}:${port}`;
  const socket = net.createConnection({ host, port, timeout }, () => {
    console.log(`Connected to "${address}`);
    socket.end();
    resolve(true);
  });

  socket.on("error", e => {
    reject(new Error(`Connection error for "${address}": ${e.message}`));
  });
  socket.on("timeout", () => {
    socket.destroy();
    reject(new Error(`Connection timed out for "${address}"`));
  });
});
