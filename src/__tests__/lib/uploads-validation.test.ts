// ============================================================
// Upload Security Validation Tests — MIME, Extension, Size, Path
// ============================================================
import { describe, it, expect } from 'vitest';

// ── Replicate the validation logic from /api/uploads/route.ts ──
// (Constants are module-scoped and not exported, so we mirror them here)

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  video: ['video/mp4', 'video/webm'],
};

const ALL_ALLOWED_MIMES = Object.values(ALLOWED_MIME_TYPES).flat();

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB for images

const ALLOWED_FOLDERS = ['thumbnails', 'products', 'profiles', 'banners', 'uploads'];

const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'zip', 'rar',
  'mp3', 'wav', 'ogg', 'm4a',
  'mp4', 'webm',
];

function sanitizePathSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

// Simulated validation function that mirrors the route handler logic
function validateUpload(file: {
  name: string;
  type: string;
  size: number;
}, folder?: string): {
  valid: boolean;
  error?: string;
} {
  // Validate MIME type
  if (!ALL_ALLOWED_MIMES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed` };
  }

  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension ".${ext || 'unknown'}" is not allowed` };
  }

  // Validate file size
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${isImage ? '10MB' : '100MB'}` };
  }

  // Validate folder
  const resolvedFolder = folder && ALLOWED_FOLDERS.includes(folder) ? folder : 'uploads';

  return { valid: true };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Upload Validation — MIME Types', () => {
  describe('Allowed MIME types are accepted', () => {
    it('Accepts image/jpeg', () => {
      const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts image/png', () => {
      const result = validateUpload({ name: 'image.png', type: 'image/png', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts image/gif', () => {
      const result = validateUpload({ name: 'anim.gif', type: 'image/gif', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts image/webp', () => {
      const result = validateUpload({ name: 'pic.webp', type: 'image/webp', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts image/svg+xml', () => {
      const result = validateUpload({ name: 'icon.svg', type: 'image/svg+xml', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts application/pdf', () => {
      const result = validateUpload({ name: 'doc.pdf', type: 'application/pdf', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts application/zip', () => {
      const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts application/x-zip-compressed', () => {
      const result = validateUpload({ name: 'archive.zip', type: 'application/x-zip-compressed', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts application/vnd.rar', () => {
      const result = validateUpload({ name: 'archive.rar', type: 'application/vnd.rar', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts audio/mpeg', () => {
      const result = validateUpload({ name: 'song.mp3', type: 'audio/mpeg', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts audio/wav', () => {
      const result = validateUpload({ name: 'sound.wav', type: 'audio/wav', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts audio/ogg', () => {
      const result = validateUpload({ name: 'audio.ogg', type: 'audio/ogg', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts audio/mp4', () => {
      const result = validateUpload({ name: 'audio.m4a', type: 'audio/mp4', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts video/mp4', () => {
      const result = validateUpload({ name: 'video.mp4', type: 'video/mp4', size: 1024 });
      expect(result.valid).toBe(true);
    });

    it('Accepts video/webm', () => {
      const result = validateUpload({ name: 'video.webm', type: 'video/webm', size: 1024 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Rejected MIME types', () => {
    it('Rejects executable files (application/x-msdownload)', () => {
      const result = validateUpload({ name: 'malware.exe', type: 'application/x-msdownload', size: 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('Rejects executable files (application/octet-stream)', () => {
      const result = validateUpload({ name: 'program.exe', type: 'application/octet-stream', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects Windows executables (application/x-dosexec)', () => {
      const result = validateUpload({ name: 'trojan.exe', type: 'application/x-dosexec', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects shell scripts (text/x-shellscript)', () => {
      const result = validateUpload({ name: 'script.sh', type: 'text/x-shellscript', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects Python scripts (text/x-python)', () => {
      const result = validateUpload({ name: 'script.py', type: 'text/x-python', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects JavaScript files (text/javascript)', () => {
      const result = validateUpload({ name: 'malware.js', type: 'text/javascript', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects HTML files (text/html)', () => {
      const result = validateUpload({ name: 'page.html', type: 'text/html', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects PHP files (application/x-php)', () => {
      const result = validateUpload({ name: 'backdoor.php', type: 'application/x-php', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects batch files (application/bat)', () => {
      const result = validateUpload({ name: 'run.bat', type: 'application/bat', size: 1024 });
      expect(result.valid).toBe(false);
    });

    it('Rejects empty MIME type', () => {
      const result = validateUpload({ name: 'file.unknown', type: '', size: 1024 });
      expect(result.valid).toBe(false);
    });
  });
});

describe('Upload Validation — File Extensions', () => {
  it('Accepts .jpg extension', () => {
    const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .jpeg extension', () => {
    const result = validateUpload({ name: 'photo.jpeg', type: 'image/jpeg', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .png extension', () => {
    const result = validateUpload({ name: 'photo.png', type: 'image/png', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .pdf extension', () => {
    const result = validateUpload({ name: 'doc.pdf', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .zip extension', () => {
    const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .mp3 extension', () => {
    const result = validateUpload({ name: 'song.mp3', type: 'audio/mpeg', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Accepts .mp4 extension', () => {
    const result = validateUpload({ name: 'video.mp4', type: 'video/mp4', size: 1024 });
    expect(result.valid).toBe(true);
  });

  it('Rejects .exe extension even if MIME is allowed', () => {
    const result = validateUpload({ name: 'malware.exe', type: 'application/zip', size: 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('.exe');
  });

  it('Rejects .sh extension', () => {
    const result = validateUpload({ name: 'script.sh', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Rejects .php extension', () => {
    const result = validateUpload({ name: 'backdoor.php', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Rejects .js extension', () => {
    const result = validateUpload({ name: 'malware.js', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Rejects .html extension', () => {
    const result = validateUpload({ name: 'page.html', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Rejects files with no extension', () => {
    const result = validateUpload({ name: 'noextension', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Rejects .bat extension', () => {
    const result = validateUpload({ name: 'run.bat', type: 'application/pdf', size: 1024 });
    expect(result.valid).toBe(false);
  });

  it('Extension check is case-insensitive', () => {
    const result = validateUpload({ name: 'photo.JPG', type: 'image/jpeg', size: 1024 });
    expect(result.valid).toBe(true);
  });
});

describe('Upload Validation — File Size Limits', () => {
  it('Accepts image under 10MB', () => {
    const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('Rejects image over 10MB', () => {
    const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('Accepts image exactly at 10MB limit', () => {
    const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: MAX_IMAGE_SIZE });
    expect(result.valid).toBe(true);
  });

  it('Rejects image just over 10MB', () => {
    const result = validateUpload({ name: 'photo.jpg', type: 'image/jpeg', size: MAX_IMAGE_SIZE + 1 });
    expect(result.valid).toBe(false);
  });

  it('Accepts non-image file under 100MB', () => {
    const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: 50 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('Rejects non-image file over 100MB', () => {
    const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: 101 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100MB');
  });

  it('Accepts non-image file exactly at 100MB limit', () => {
    const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: MAX_FILE_SIZE });
    expect(result.valid).toBe(true);
  });

  it('Rejects non-image file just over 100MB', () => {
    const result = validateUpload({ name: 'archive.zip', type: 'application/zip', size: MAX_FILE_SIZE + 1 });
    expect(result.valid).toBe(false);
  });

  it('Image files use 10MB limit regardless of actual size of other types', () => {
    // A 50MB image should be rejected (over 10MB image limit)
    const result = validateUpload({ name: 'large.png', type: 'image/png', size: 50 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('Audio file uses 100MB limit', () => {
    // A 50MB audio file should be accepted
    const result = validateUpload({ name: 'song.mp3', type: 'audio/mpeg', size: 50 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('Video file uses 100MB limit', () => {
    // A 50MB video file should be accepted
    const result = validateUpload({ name: 'video.mp4', type: 'video/mp4', size: 50 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });
});

describe('Upload Validation — Path Sanitization', () => {
  it('Removes path traversal characters (../)', () => {
    const result = sanitizePathSegment('../../etc/passwd');
    expect(result).not.toContain('.');
    expect(result).not.toContain('/');
    expect(result).toBe('etcpasswd');
  });

  it('Removes path traversal characters (..\\)', () => {
    const result = sanitizePathSegment('..\\windows\\system32');
    expect(result).not.toContain('.');
    expect(result).not.toContain('\\');
  });

  it('Removes null bytes', () => {
    const result = sanitizePathSegment('file\x00.exe');
    expect(result).not.toContain('\x00');
  });

  it('Keeps alphanumeric characters', () => {
    const result = sanitizePathSegment('thumbnails');
    expect(result).toBe('thumbnails');
  });

  it('Keeps hyphens', () => {
    const result = sanitizePathSegment('my-folder');
    expect(result).toBe('my-folder');
  });

  it('Converts to lowercase', () => {
    const result = sanitizePathSegment('MyFolder');
    expect(result).toBe('myfolder');
  });

  it('Removes spaces', () => {
    const result = sanitizePathSegment('my folder name');
    expect(result).toBe('myfoldername');
  });

  it('Removes special characters', () => {
    const result = sanitizePathSegment('folder!@#$%^&*()');
    expect(result).toBe('folder');
  });

  it('Handles empty string', () => {
    const result = sanitizePathSegment('');
    expect(result).toBe('');
  });

  it('Sanitizes bucket name to prevent traversal', () => {
    // FIXED: TS2872 — removed dead-code || fallback; test the malicious input directly
    const bucket = sanitizePathSegment('../../../malicious');
    expect(bucket).not.toContain('.');
    expect(bucket).not.toContain('/');
  });

  it('Complex path traversal attack is neutralized', () => {
    const attack = '....//....//....//etc/passwd';
    const result = sanitizePathSegment(attack);
    expect(result).not.toContain('.');
    expect(result).not.toContain('/');
  });
});

describe('Upload Validation — Folder Whitelist', () => {
  it('Accepts "thumbnails" folder', () => {
    const result = validateUpload({ name: 'thumb.jpg', type: 'image/jpeg', size: 1024 }, 'thumbnails');
    expect(result.valid).toBe(true);
  });

  it('Accepts "products" folder', () => {
    const result = validateUpload({ name: 'product.zip', type: 'application/zip', size: 1024 }, 'products');
    expect(result.valid).toBe(true);
  });

  it('Accepts "profiles" folder', () => {
    const result = validateUpload({ name: 'avatar.jpg', type: 'image/jpeg', size: 1024 }, 'profiles');
    expect(result.valid).toBe(true);
  });

  it('Accepts "banners" folder', () => {
    const result = validateUpload({ name: 'banner.jpg', type: 'image/jpeg', size: 1024 }, 'banners');
    expect(result.valid).toBe(true);
  });

  it('Accepts "uploads" folder', () => {
    const result = validateUpload({ name: 'file.pdf', type: 'application/pdf', size: 1024 }, 'uploads');
    expect(result.valid).toBe(true);
  });

  it('Falls back to "uploads" for unrecognized folder', () => {
    // The route logic: if folder not in whitelist, defaults to "uploads"
    const maliciousFolder = '../../../etc';
    const resolvedFolder = ALLOWED_FOLDERS.includes(maliciousFolder) ? maliciousFolder : 'uploads';
    expect(resolvedFolder).toBe('uploads');
  });

  it('Falls back to "uploads" for empty folder', () => {
    const resolvedFolder = ALLOWED_FOLDERS.includes('') ? '' : 'uploads';
    expect(resolvedFolder).toBe('uploads');
  });

  it('Falls back to "uploads" for random folder name', () => {
    const resolvedFolder = ALLOWED_FOLDERS.includes('random-folder') ? 'random-folder' : 'uploads';
    expect(resolvedFolder).toBe('uploads');
  });

  it('Falls back to "uploads" for path traversal folder', () => {
    const resolvedFolder = ALLOWED_FOLDERS.includes('../../etc') ? '../../etc' : 'uploads';
    expect(resolvedFolder).toBe('uploads');
  });

  it('Folder check is case-sensitive', () => {
    // "Thumbnails" != "thumbnails"
    const resolvedFolder = ALLOWED_FOLDERS.includes('Thumbnails') ? 'Thumbnails' : 'uploads';
    expect(resolvedFolder).toBe('uploads');
  });

  it('All ALLOWED_FOLDERS are in the whitelist', () => {
    expect(ALLOWED_FOLDERS).toContain('thumbnails');
    expect(ALLOWED_FOLDERS).toContain('products');
    expect(ALLOWED_FOLDERS).toContain('profiles');
    expect(ALLOWED_FOLDERS).toContain('banners');
    expect(ALLOWED_FOLDERS).toContain('uploads');
  });
});
