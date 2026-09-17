import * as bg from './pqc_kyber_bg.js';

let ready = null;

async function instantiate() {
    const imports = { './pqc_kyber_bg.js': bg };
    const url = '/vendor/pqc-kyber/pqc_kyber_bg.wasm';
    try {
        const { instance } = await WebAssembly.instantiateStreaming(fetch(url), imports);
        return instance;
    } catch {
        const bytes = await (await fetch(url)).arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, imports);
        return instance;
    }
}

export function initKyber() {
    if (!ready) {
        ready = instantiate().then((instance) => {
            bg.__wbg_set_wasm(instance.exports);
        });
        ready.catch(() => { ready = null; });
    }
    return ready;
}

export const setDeterministicRng = bg.__qx_set_rng;
export { keypair, encapsulate, decapsulate, Params } from './pqc_kyber_bg.js';
