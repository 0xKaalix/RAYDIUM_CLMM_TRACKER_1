import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";


export interface MemecoinData {
    memecoin_GMGN_Link:string;
    time:Date;
  }
  

export const saveMemecoinData = async (data: MemecoinData) => {
  try {
    const docRef = await addDoc(collection(db, "Raydium_CLMM_Memecoins"), data);
    console.log("Memecoin Data stored with ID:", docRef.id);
  } catch (error) {
    console.error("Error storing data:", error);
  }
};
