const AUTO_BACKUP_KEY = 'picpocket:auto-backup';

export function getAutoBackupPref() {
  return localStorage.getItem(AUTO_BACKUP_KEY) === 'true';
}

export function setAutoBackupPref(value) {
  localStorage.setItem(AUTO_BACKUP_KEY, value ? 'true' : 'false');
}
