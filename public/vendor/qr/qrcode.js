const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134];
const EC_PER_BLOCK = { L: [0, 7, 10, 15, 20, 26], M: [0, 10, 16, 26, 18, 24] };
const BLOCK_COUNT = { L: [0, 1, 1, 1, 1, 1], M: [0, 1, 1, 1, 2, 2] };
const DATA_CAPACITY = { L: [0, 19, 34, 55, 80, 108], M: [0, 16, 28, 44, 64, 86] };
const REMAINDER_BITS = [0, 0, 7, 7, 7, 7];
const ALIGNMENT = [0, 0, [6, 18], [6, 22], [6, 26], [6, 30]];
const EC_BITS = { L: 1, M: 0 };

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11D;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
}

function rsGenerator(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= gfMul(poly[j], EXP[i]);
            next[j + 1] ^= poly[j];
        }
        poly = next;
    }
    return poly;
}

function rsRemainder(data, degree) {
    const gen = rsGenerator(degree).slice().reverse();
    const result = new Array(degree).fill(0);
    for (const byte of data) {
        const factor = byte ^ result.shift();
        result.push(0);
        for (let i = 0; i < degree; i++) {
            result[i] ^= gfMul(gen[i + 1], factor);
        }
    }
    return result;
}

function formatBits(ecLevel, mask) {
    let data = (EC_BITS[ecLevel] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) {
        rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
    }
    return (((data << 10) | rem) ^ 0x5412) & 0x7FFF;
}

const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r, c) => (((r * c) % 2 + (r * c) % 3) % 2) === 0,
    (r, c) => (((r + c) % 2 + (r * c) % 3) % 2) === 0
];

function penalty(modules) {
    const n = modules.length;
    let score = 0;
    for (let r = 0; r < n; r++) {
        let run = 1;
        for (let c = 1; c < n; c++) {
            if (modules[r][c] === modules[r][c - 1]) {
                run++;
            } else {
                if (run >= 5) score += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) score += 3 + (run - 5);
    }
    for (let c = 0; c < n; c++) {
        let run = 1;
        for (let r = 1; r < n; r++) {
            if (modules[r][c] === modules[r - 1][c]) {
                run++;
            } else {
                if (run >= 5) score += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) score += 3 + (run - 5);
    }
    for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
            const v = modules[r][c];
            if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
                score += 3;
            }
        }
    }
    const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const inverted = [0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1];
    function matchAt(line, pos, pat) {
        for (let i = 0; i < 11; i++) {
            if (line[pos + i] !== pat[i]) return false;
        }
        return true;
    }
    for (let r = 0; r < n; r++) {
        for (let c = 0; c <= n - 11; c++) {
            if (matchAt(modules[r], c, pattern) || matchAt(modules[r], c, inverted)) score += 40;
        }
    }
    for (let c = 0; c < n; c++) {
        for (let r = 0; r <= n - 11; r++) {
            let okP = true, okI = true;
            for (let i = 0; i < 11; i++) {
                if (modules[r + i][c] !== pattern[i]) okP = false;
                if (modules[r + i][c] !== inverted[i]) okI = false;
            }
            if (okP || okI) score += 40;
        }
    }
    let dark = 0;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (modules[r][c]) dark++;
        }
    }
    const ratio = (dark * 20) / (n * n);
    score += Math.abs(Math.round(ratio) - 10) * 10;
    return score;
}

function buildMatrix(version, dataCodewords, ecLevel, mask) {
    const n = version * 4 + 17;
    const modules = Array.from({ length: n }, () => new Array(n).fill(false));
    const functional = Array.from({ length: n }, () => new Array(n).fill(false));

    function set(r, c, dark, fn = true) {
        modules[r][c] = dark;
        if (fn) functional[r][c] = true;
    }

    function finder(r, c) {
        for (let dr = -1; dr <= 7; dr++) {
            for (let dc = -1; dc <= 7; dc++) {
                const rr = r + dr, cc = c + dc;
                if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
                const dark = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) &&
                    (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
                set(rr, cc, dark);
            }
        }
    }
    finder(0, 0);
    finder(0, n - 7);
    finder(n - 7, 0);

    for (let i = 8; i < n - 8; i++) {
        const dark = i % 2 === 0;
        set(6, i, dark);
        set(i, 6, dark);
    }

    if (version >= 2) {
        const centers = ALIGNMENT[version];
        for (const r of centers) {
            for (const c of centers) {
                const overlapsFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8);
                if (overlapsFinder) continue;
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const edge = Math.max(Math.abs(dr), Math.abs(dc));
                        set(r + dr, c + dc, edge !== 1);
                    }
                }
            }
        }
    }

    set(4 * version + 9, 8, true);

    const bits = [];
    for (const b of dataCodewords) {
        for (let i = 7; i >= 0; i--) bits.push(((b >>> i) & 1) === 1);
    }
    // Reserve format-info areas so data bits never land where format bits go
    for (let i = 0; i <= 5; i++) { functional[8][i] = true; functional[i][8] = true; }
    functional[8][7] = true;
    functional[8][8] = true;
    functional[7][8] = true;
    for (let i = 0; i < 8; i++) functional[8][n - 1 - i] = true;
    for (let i = 8; i < 15; i++) functional[n - 15 + i][8] = true;

    const isMasked = MASKS[mask];
    let bitIndex = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
        let x = right;
        if (x === 6) x = 5;
        for (let vert = 0; vert < n; vert++) {
            for (let j = 0; j < 2; j++) {
                const xx = x - j;
                const upward = ((x + 1) & 2) === 0;
                const yy = upward ? n - 1 - vert : vert;
                if (!functional[yy][xx] && bitIndex < bits.length) {
                    let dark = bits[bitIndex];
                    bitIndex++;
                    if (isMasked(yy, xx)) dark = !dark;
                    set(yy, xx, dark, false);
                }
            }
        }
    }

    const fmt = formatBits(ecLevel, mask);
    const bit = (i) => ((fmt >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(i, 8, bit(i));
    set(7, 8, bit(6));
    set(8, 8, bit(7));
    set(8, 7, bit(8));
    for (let i = 9; i < 15; i++) set(8, 14 - i, bit(i));
    for (let i = 0; i < 8; i++) set(8, n - 1 - i, bit(i));
    for (let i = 8; i < 15; i++) set(n - 15 + i, 8, bit(i));

    return { modules, functional };
}

export function qrMatrix(text, ecLevel = 'M') {
    if (ecLevel !== 'L' && ecLevel !== 'M') {
        throw new Error('Only EC levels L and M are supported');
    }
    const data = new TextEncoder().encode(text);
    let version = 0;
    for (let v = 1; v <= 5; v++) {
        const capacityBits = DATA_CAPACITY[ecLevel][v] * 8;
        const needBits = 4 + 8 + data.length * 8;
        if (needBits <= capacityBits) {
            version = v;
            break;
        }
    }
    if (version === 0) {
        throw new Error('Input too long for QR versions 1-5');
    }

    const capacity = DATA_CAPACITY[ecLevel][version];
    const bits = [];
    function appendBits(value, count) {
        for (let i = count - 1; i >= 0; i--) bits.push(((value >>> i) & 1) === 1);
    }
    appendBits(4, 4);
    appendBits(data.length, 8);
    for (const b of data) appendBits(b, 8);
    const maxBits = capacity * 8;
    const terminator = Math.min(4, maxBits - bits.length);
    for (let i = 0; i < terminator; i++) bits.push(false);
    while (bits.length % 8 !== 0) bits.push(false);
    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] ? 1 : 0);
        codewords.push(b);
    }
    for (let pad = 0xEC; codewords.length < capacity; pad ^= 0xEC ^ 0x11) {
        codewords.push(pad);
    }

    const ecPerBlock = EC_PER_BLOCK[ecLevel][version];
    const blockCount = BLOCK_COUNT[ecLevel][version];
    const dataPerBlock = capacity / blockCount;
    const blocks = [];
    for (let b = 0; b < blockCount; b++) {
        blocks.push(codewords.slice(b * dataPerBlock, (b + 1) * dataPerBlock));
    }
    const interleaved = [];
    for (let i = 0; i < dataPerBlock; i++) {
        for (const block of blocks) interleaved.push(block[i]);
    }
    const ecBlocks = blocks.map((block) => rsRemainder(block, ecPerBlock));
    for (let i = 0; i < ecPerBlock; i++) {
        for (const ec of ecBlocks) interleaved.push(ec[i]);
    }

    let best = null;
    for (let mask = 0; mask < 8; mask++) {
        const { modules } = buildMatrix(version, interleaved, ecLevel, mask);
        const score = penalty(modules);
        if (best === null || score < best.score) {
            best = { mask, modules, score };
        }
    }
    return { size: version * 4 + 17, version, ecLevel, mask: best.mask, modules: best.modules };
}

export function drawQR(canvas, text, ecLevel = 'M') {
    const qr = qrMatrix(text, ecLevel);
    const quiet = 4;
    const total = qr.size + quiet * 2;
    const scale = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / total));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    const offsetX = Math.floor((canvas.width - total * scale) / 2);
    const offsetY = Math.floor((canvas.height - total * scale) / 2);
    for (let r = 0; r < qr.size; r++) {
        for (let c = 0; c < qr.size; c++) {
            if (qr.modules[r][c]) {
                ctx.fillRect(offsetX + (c + quiet) * scale, offsetY + (r + quiet) * scale, scale, scale);
            }
        }
    }
    return qr;
}

export const __test = { formatBits, rsRemainder, TOTAL_CODEWORDS };
