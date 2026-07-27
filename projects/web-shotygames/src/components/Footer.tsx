import { Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="font-display text-3xl mb-4 text-primary">
            ShotyGames
          </h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Los mejores juegos de mesa para beber en Ecuador. Entrega inmediata en Machala y envíos a todo el país.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="https://www.facebook.com/shotygames" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-smooth text-white"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/shotygames" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-smooth text-white"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://www.tiktok.com/@shotygames" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-smooth text-white"
              aria-label="TikTok"
            >
              <span className="font-bold text-sm">TT</span>
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">

          <div className="text-center text-white/60 text-sm">
            <p>© {currentYear} ShotyGames Ecuador. Todos los derechos reservados.</p>
            <p className="mt-2">🔞 Producto para mayores de 18 años. Consume responsablemente.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
