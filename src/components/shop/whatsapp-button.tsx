import { whatsappUrl } from "@/lib/site";

// Floating "Need help? Chat with us" WhatsApp button (same as the old site).
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Need help? Chat with us on WhatsApp"
      className="group fixed right-4 bottom-20 z-30 flex items-center gap-2 lg:right-6 lg:bottom-6"
    >
      <span className="hidden rounded-full bg-background px-3 py-1.5 text-sm text-heading shadow-md ring-1 ring-border sm:block">
        Need help? <span className="font-semibold">Chat with us</span>
      </span>
      <span className="flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-7 fill-current" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.42 9.42 0 0 1-1.45-5.03c0-5.21 4.24-9.45 9.46-9.45a9.4 9.4 0 0 1 6.69 2.77 9.4 9.4 0 0 1 2.77 6.69c0 5.21-4.24 9.45-9.44 9.45zm8.05-17.5A11.3 11.3 0 0 0 12.04.67C5.77.67.67 5.77.67 12.04c0 2 .52 3.96 1.52 5.69L.57 23.33l5.73-1.5a11.36 11.36 0 0 0 5.74 1.46h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.04z" />
        </svg>
      </span>
    </a>
  );
}
