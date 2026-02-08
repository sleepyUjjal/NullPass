// Pure logic extracted from authenticate.js
// No DOM manipulation here, just math and crypto.

export const generateDeviceId = () => {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

export const formatPEM = (base64, type) => {
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
};

// CRITICAL: Python's ecdsa library needs DER format, WebCrypto gives P1363
export const convertP1363ToDER = (signature) => {
    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    
    function encodeInteger(value) {
        let i = 0;
        while (i < value.length && value[i] === 0) i++;
        if (i === value.length) return new Uint8Array([0x02, 0x01, 0x00]);
        
        let result = value.slice(i);
        if (result[0] & 0x80) {
            const temp = new Uint8Array(result.length + 1);
            temp[0] = 0x00;
            temp.set(result, 1);
            result = temp;
        }
        
        const der = new Uint8Array(2 + result.length);
        der[0] = 0x02; 
        der[1] = result.length;
        der.set(result, 2);
        return der;
    }
    
    const rDER = encodeInteger(r);
    const sDER = encodeInteger(s);
    
    const sequenceLength = rDER.length + sDER.length;
    const der = new Uint8Array(2 + sequenceLength);
    der[0] = 0x30; 
    der[1] = sequenceLength;
    der.set(rDER, 2);
    der.set(sDER, 2 + rDER.length);
    
    return der;
};

// Generate Keys (P-256)
export const generateKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
    );

    // Export Public
    const pubBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const pubPem = formatPEM(arrayBufferToBase64(pubBuffer), 'PUBLIC KEY');

    // Export Private
    const privBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privBase64 = arrayBufferToBase64(privBuffer);

    return { pubPem, privBase64 };
};

// Sign Data
export const signData = async (privateKeyBase64, dataString) => {
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );

    const messageBuffer = new TextEncoder().encode(dataString);
    const signatureBuffer = await window.crypto.subtle.sign(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        privateKey,
        messageBuffer
    );

    // Convert to format Django expects
    const signatureDER = convertP1363ToDER(new Uint8Array(signatureBuffer));
    return arrayBufferToBase64(signatureDER.buffer);
};  