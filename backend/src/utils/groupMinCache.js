// Cache simples compartilhado para mínimos por grupo
// Estrutura: { data: Array | null, at: number }
let state = { data: null, at: 0 };

function get() {
  return state;
}

function set(data) {
  state = { data, at: Date.now() };
}

function clear() {
  state = { data: null, at: 0 };
}

module.exports = { get, set, clear };
