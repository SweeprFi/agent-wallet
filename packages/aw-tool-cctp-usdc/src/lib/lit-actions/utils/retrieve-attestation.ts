import { API_URL, DESTINATION_DOMAINS } from "./constants";
import axios from "axios";

export const retrieveAttestation = async (
    transactionHash: string,
    sourceChainId: number
) => {
    const url = `${API_URL[sourceChainId]}/v2/messages/${DESTINATION_DOMAINS[sourceChainId]}?transactionHash=${transactionHash}`;

    while (true) {
        try {
            const response = await axios.get(url);
            if (response.data?.messages?.[0]?.status === "complete") {
                console.log("Attestation retrieved!");
                console.log("Response:", response);
                console.log("Response data:", response.data);

                return response.data.messages[0];
            }
            console.log("Waiting for attestation...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error: any) {
            if (axios.isAxiosError(error) && error?.response?.status === 404) {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                continue;
            }
            console.error("Attestation retrieval failed");
            throw error;
        }
    }
};
