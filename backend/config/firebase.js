const path = require("node:path");
const dotenv = require("dotenv");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnvironmentVariables = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name],
);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(
        `Missing required Firebase environment variables: ${missingEnvironmentVariables.join(", ")}`,
    );
}

const firebaseApp =
    getApps()[0] ||
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

module.exports = { db, auth };
