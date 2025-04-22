export function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

export function getMousePos(evt, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
