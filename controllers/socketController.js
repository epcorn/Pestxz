import { io } from "../server";

io.on("connection", (socket) => {
  socket.on("join-admin", (role) => {
    if (
      [
        "Admin",
        "ClientAdmin",
        "Operator",
        "BranchAdmin",
        "Supervisor",
        "TeamLeader",
      ].includes(role)
    ) {
      socket.join("admin-room");
      console.log(`${role} joined Pestxz-room`); // helpful for debugging
    }
  });
  //join client
  socket.on("join-client", (clientId) => {
    if (clientId) {
      socket.join(`client-${clientId}`);
      console.log(`socket joined client-${clientId}`);
    }
  });

  // services
  socket.on("services", (data) => {
    io.to("admin-room").to(`client-${data.client}`).emit("services", data); // 👈 was broadcast.emit
  });
  socket.on("unscheduled-raised", (data) => {
    io.to("admin-room").emit("new-unscheduled-work", data); // 👈 was broadcast.emit
  });

  // updated
  socket.on("unscheduled-updated", (data) => {
    io.to("admin-room").emit("work-status-changed", data); // 👈 was broadcast.emit
  });

  // approved
  socket.on("unscheduled-approved", (data) => {
    io.to("admin-room").emit("work-status-approved", data); // 👈 was broadcast.emit
  });

  // rejected
  socket.on("unscheduled-rejected", (data) => {
    io.to("admin-room").emit("work-status-rejected", data); // 👈 was broadcast.emit
  });

  // complaint raised
  socket.on("complaint-raised", (data) => {
    io.to("admin-room").emit("new-complaint", data);
  });

  socket.on("complaint-updated", (data) => {
    io.to("admin-room").emit("complaint-updated", data);
  });
  socket.on("complaint-assigned", (data) => {
    io.to("admin-room").emit("complaint-assigned", data);
  });
});
