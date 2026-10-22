import bcrypt from "bcrypt"

export const hashValue = async ( val: string, saltRounds?: number) => {
    return bcrypt.hash(val, saltRounds || 10);
}

export const compareValue = async (val: string, hashedValue: string) => {
    return bcrypt.compare(val, hashedValue).catch(() => false);
}
