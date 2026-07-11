const sseClients = new Set();
const recentEvents = [];
const MAX_EVENTS = 50;

function broadcastEvent(eventInput) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    severity: 'INFO',
    ...eventInput
  };

  recentEvents.unshift(event);
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.pop();
  }

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach(clientRes => {
    try {
      clientRes.write(payload);
    } catch (err) {
      sseClients.delete(clientRes);
    }
  });

  return event;
}

function addClient(res) {
  sseClients.add(res);
}

function removeClient(res) {
  sseClients.delete(res);
}

function getRecentEvents() {
  return recentEvents;
}

module.exports = {
  broadcastEvent,
  addClient,
  removeClient,
  getRecentEvents
};
