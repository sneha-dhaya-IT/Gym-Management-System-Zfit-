import mongoose from 'mongoose';
import { compareValue, hashValue }  from '../util/bcrypt.util.js';

export interface UserDocument extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    verified: boolean;
    contactNo: string;
    dob: Date;
    profile: {
        avatar: string;
        address: string;
        emergencyContact: string;
    };
    consent: {
        gdpr: boolean;
        marketing: boolean;
        date: Date;
    };
    role: string;
    qrCode: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;

    comparePassword(val: string): Promise<boolean>;
    omitPassword(): Pick<
    UserDocument,
    "_id" | "name" | "email" | "verified" | "contactNo" | "dob" | "profile" | "consent" | "role" | "qrCode" | "status" | "createdAt" | "updatedAt"
    >
}

const userSchema = new mongoose.Schema<UserDocument>({
        name: { 
            type: String, 
            required: true
        },
        email: { 
            type: String, 
            required: true,
            unique: true,
            lowercase: true,
            validate: {
                validator: function(v: string) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); 
                },
                message: 'Invalid email format'
            }
        },
        password: { 
            type: String, 
            required: true,
            minLength: 8,
            validate: {
                validator: function(v: string) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);
                },
                message: 'Password should be at least 8 characters long and should contain at least one upper case letter, one lower case letter, a number and a special character'
            }
        },
        verified: { 
            type: Boolean, 
            required: true, 
            default: false
        },
        contactNo: { 
            type: String, 
            required: true,
            validate: {
                validator: function(v: string) {
                    return /^(?:\+94|0)[1-9]\d{8}$/.test(v);
                },
                message: 'Invalid phone number'
            }
        },
        dob: { 
            type: Date,
            required: false,
        },
        profile: {
            avatar: {
                 type: String 
                },
            address: { 
                type: String, 
                required: false,
            },
            emergencyContact: { 
                type: String
            }
        },
        consent: {
            gdpr: {
                type: Boolean,
                required: true,
                default: false
            },
            marketing: {
                type: Boolean,
                default: false
            },
            date: {
                type: Date,
                required: true,
                default: Date.now()
            }
        },
        role: {
            type: String,
            enum: ['member', 'staff', 'manager'],
            required: true,
            default: 'member'
        },
        qrCode: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: [ 'active', 'inactive', 'expired'],
            default: 'active'
        }

    }, 
    {
        timestamps: true,
    }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1, status: 1});

userSchema.pre("save", async function (next){
    if(!this.isModified("password")){
        return next();
    }

    this.password = await hashValue(this.password);
    return next();
});

userSchema.methods.comparePassword = async function (val: string){
    return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
}

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
