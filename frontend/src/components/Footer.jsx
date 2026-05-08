import { Donut } from "lucide-react";

export const Footer = () => {
  return (
    <footer
      data-testid="main-footer"
      className="border-t border-[#EAE0D5] bg-[#FDFBF7] mt-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D95A4E] text-white">
                <Donut className="h-4 w-4" />
              </span>
              <span className="font-display font-semibold text-[#3E2723]">DoughCast</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-[#795548] leading-relaxed">
              Probabilistic mochi donut forecasting for independent bakeries. Less waste, fresher batches, smarter mornings.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#795548]">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-[#3E2723]">
              <li><a href="#features" data-testid="footer-link-features" className="hover:text-[#D95A4E]">Features</a></li>
              <li><a href="#how-it-works" data-testid="footer-link-how" className="hover:text-[#D95A4E]">How it works</a></li>
              <li><a href="#pricing" data-testid="footer-link-pricing" className="hover:text-[#D95A4E]">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#795548]">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-[#3E2723]">
              <li><a href="#about" data-testid="footer-link-about" className="hover:text-[#D95A4E]">About</a></li>
              <li><a href="#contact" data-testid="footer-link-contact" className="hover:text-[#D95A4E]">Contact</a></li>
              <li><a href="#privacy" data-testid="footer-link-privacy" className="hover:text-[#D95A4E]">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[#EAE0D5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#A1887F]">© {new Date().getFullYear()} DoughCast. Crafted for bakers.</p>
          <p className="text-xs text-[#A1887F] font-mono">v0.1 · scaffold</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
