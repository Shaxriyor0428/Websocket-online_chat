const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 }, () => {
  console.log("Chat server ishga tushdi port 3000-da");
});

const users = new Map();

function generateUserId() {
  return Math.random().toString(36).slice(2, 9);
}

server.on("connection", (ws) => {
  console.log("Yangi user qo'shildi!");

  ws.on("message", (message) => {
    const messageData = JSON.parse(message);
    switch (messageData.type) {
      case "nick":
        if (users.has(messageData.value)) {
          ws.send(JSON.stringify({ type: "nick_busy" }));
          ws.close();
        } else {
          ws.send(
            JSON.stringify({
              type: "welcome",
              value: "Chatga xush kelibsiz!",
            })
          );
          const userId = generateUserId();
          ws.send(JSON.stringify({ type: "user_id", userId }));

          users.set(messageData.value, userId);
          // console.log(users);
          server.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "user_connected",
                  nick: messageData.value,
                })
              );
            }
          });
        }
        break;
      case "message":
        server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message",
                nick: messageData.nick,
                message: messageData.value,
              })
            );
          }
        });
        break;
      default:
        break;
    }
  });

  ws.on("close", () => {
    for (let [nick, id] of users) {
      if (users.get(nick) === id) {
        users.delete(nick);
        server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "user_disconnected",
                nick: nick,
              })
            );
          }
        });
      }
    }
  });
});
