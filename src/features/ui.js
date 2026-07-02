const config = require('../config');

const ICON = {
  ok: '✓',
  fail: '✕',
  warn: '!',
  info: 'i',
  arrow: '›',
  dot: '•',
};

function header(title, subtitle) {
  return [`╭─「 ${title} 」`, subtitle ? `│ ${subtitle}` : null, '╰────────────'].filter(Boolean).join('\n');
}

function section(title, lines = []) {
  return [`┌─ ${title}`, ...lines.map((line) => `│ ${line}`), '└'].join('\n');
}

function row(label, value) {
  return `${ICON.arrow} ${label}: ${value}`;
}

function command(name, hint) {
  const cmd = `${config.prefix}${name}`;
  return hint ? `*${cmd}* — ${hint}` : `*${cmd}*`;
}

function status(enabled) {
  return enabled ? 'ON ✓' : 'OFF ✕';
}

function success(text) {
  return `${ICON.ok} ${text}`;
}

function error(text) {
  return `${ICON.fail} ${text}`;
}

function warning(text) {
  return `${ICON.warn} ${text}`;
}

function info(text) {
  return `${ICON.info} ${text}`;
}

module.exports = { ICON, header, section, row, command, status, success, error, warning, info };
