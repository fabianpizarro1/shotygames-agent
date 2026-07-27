import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/593993154462?text=Hola, tengo una consulta sobre los productos', '_blank');
  };

  return (
    <Button
      variant="whatsapp"
      size="icon"
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl hover:scale-110 animate-pulse"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
    </Button>
  );
};

export default WhatsAppButton;
