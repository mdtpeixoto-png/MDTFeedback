function getTimestampFromUUID(uuid) {
    const parts = uuid.split('-');
    if (parts.length !== 5) return null;
    
    // UUID v1 format: time_low - time_mid - time_hi_and_version - clock_seq - node
    const timeLow = parts[0];
    const timeMid = parts[1];
    const timeHiAndVersion = parts[2];
    
    // Extract timestamp
    const timeHi = timeHiAndVersion.substring(1); // remove version
    const timestampHex = timeHi + timeMid + timeLow;
    const timestamp = BigInt('0x' + timestampHex);
    
    // UUID epoch is 1582-10-15 00:00:00.000000000
    // Unix epoch is 1970-01-01 00:00:00.000
    // Difference is 122192928000000000 in 100-ns intervals
    const unixTimestampMs = Number((timestamp - 122192928000000000n) / 10000n);
    
    return unixTimestampMs;
}

const uuid = '33d0cd67-3fe6-11f1-bf90-f4034359c71c';
const ms = getTimestampFromUUID(uuid);
console.log('UUID:', uuid);
console.log('Date:', new Date(ms).toISOString());
console.log('Unix Timestamp (sec):', Math.floor(ms / 1000));
