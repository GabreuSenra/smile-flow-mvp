import { toast } from "sonner";

export class globalFunctions {
    static copyToClipboard(text: string) 
    {
        navigator.clipboard.writeText(text).then(() => {
            toast.error("Texto copiado para área de transferência.");
        })
    }
}