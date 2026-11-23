import { business, contact } from "@/lib/site";

// Policy pages (/pages/<slug>). Text adapted from the wmartstore.in policies, with these changes
// for the new site: payments by PayU, shipping by Delhivery only, no GSTIN at checkout,
// no Shopify hosting, no Google/Meta ad tracking. Have the owner review before launch.

export type PolicySection = { heading?: string; paragraphs?: string[]; bullets?: string[] };
export type Policy = { slug: string; title: string; description: string; sections: PolicySection[] };

const days = business.returnWindowDays;
const contactLines = [
  `${business.legalName} (WMart)`,
  contact.addressLines.join(", "),
  `Phone / WhatsApp: ${contact.phoneDisplay}`,
  `Email: ${contact.email}`,
  business.supportHours,
];

export const policies: Policy[] = [
  {
    slug: "refund-policy",
    title: "Refund & Exchange Policy",
    description: `${days}-day replacement or refund for defective, damaged or wrong items, free pickup, and warranty on every product.`,
    sections: [
      { paragraphs: [`This policy applies to all orders placed on the WMart website, operated by ${business.legalName}, ${contact.addressLines.join(", ")}.`] },
      {
        heading: "Summary",
        bullets: [
          `${days} days from delivery to return a defective, non-working, damaged or wrong item we sent – for a replacement or full refund.`,
          "Free pickup for these returns wherever Delhivery offers reverse pickup.",
          "No restoration or deduction charges.",
          "Free cancellation at any time before the order is dispatched.",
          `After ${days} days, products are covered by warranty: ${business.warrantyMonthsOriginal} months on genuine OEM parts and ${business.warrantyMonthsCompatible} months on compatible parts (replacement).`,
        ],
      },
      {
        heading: "1. Defective, damaged or wrong item",
        paragraphs: [
          `If your product does not work, arrives damaged, or is not the item you ordered, contact us within ${days} days of delivery on WhatsApp (${contact.phoneDisplay}) or at ${contact.email} with your order number and a short description. We will arrange a free pickup and send you a replacement, or refund the full amount if you prefer or if a replacement is out of stock.`,
          "If reverse pickup is not available at your pin code, please send the product to our Ahmedabad address by any trackable courier; we will reimburse the courier charge along with your replacement or refund.",
        ],
      },
      {
        heading: "2. Transit damage",
        paragraphs: [
          "Please report visible transit damage within 48 hours of delivery with photos of the parcel and the product (an unboxing video helps us resolve it faster). We will replace or refund it at no cost to you.",
        ],
      },
      {
        heading: "3. Ordered the wrong part or changed your mind",
        paragraphs: [
          `Unused products in their original packaging can be returned within ${days} days of delivery. In this case the return shipping is paid by the customer; we refund the full product price once the item reaches us in its original condition. No restoration charge applies.`,
          "Not sure which part you need? Message us your laptop model or the part number printed on your old battery or charger before ordering and we will confirm compatibility.",
        ],
      },
      {
        heading: "4. Cancellations",
        paragraphs: ["You can cancel free of charge at any time before your order is dispatched. Once dispatched, the order can be returned under section 3."],
      },
      {
        heading: "5. Items we cannot accept",
        bullets: [
          "Batteries that are swollen, punctured, burnt or physically damaged after delivery.",
          "Products with a broken warranty seal, or that have been opened, modified or repaired.",
          "Damage caused by liquid, incorrect voltage, or use with an incompatible device.",
        ],
      },
      {
        heading: `6. Warranty (after the ${days}-day return window)`,
        paragraphs: ["Every product carries a replacement warranty from the date of delivery:"],
        bullets: [`Genuine OEM parts: ${business.warrantyMonthsOriginal} months`, `Compatible parts: ${business.warrantyMonthsCompatible} months`],
      },
      {
        paragraphs: [
          "The warranty covers manufacturing defects. To claim, contact us with your order number; we will arrange the return and send a tested replacement. The exclusions in section 5 apply.",
        ],
      },
      {
        heading: "7. How refunds are paid",
        paragraphs: ["We inspect returned items within 2 working days of receiving them. Approved refunds are issued within 5–7 working days:"],
        bullets: [
          "Online (PayU) orders: to the original payment method.",
          "Cash on Delivery orders: by UPI or bank transfer to the account details you share with us.",
        ],
      },
      { heading: "8. Contact", paragraphs: contactLines },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    description: "Free shipping on every order across India with Delhivery, dispatch times, Cash on Delivery and GST invoices.",
    sections: [
      { paragraphs: [`All orders are shipped by ${business.legalName} from our warehouse in South Bopal, Ahmedabad, Gujarat.`] },
      { heading: "Shipping charges", paragraphs: ["Shipping is free on every order, to every serviceable pin code in India. There is no minimum order value."] },
      {
        heading: "Dispatch and delivery times",
        bullets: [
          "Order cut-off: 3:00 PM, Monday to Saturday. Orders confirmed after 3:00 PM, or on a Sunday or public holiday, ship the next working day.",
          "Handling time: 1–2 working days.",
          "Delivery time: usually 4–6 working days after dispatch. Metro cities and Gujarat are often faster; remote areas may take longer.",
        ],
        paragraphs: [
          "We ship with Delhivery. You will receive a tracking number (AWB) by SMS/email once your order ships, and you can track it on our Track Order page.",
        ],
      },
      {
        heading: "Cash on Delivery",
        paragraphs: ["Cash on Delivery (COD) is available on most pin codes. Availability for your pin code is shown at checkout. We may call to confirm COD orders before dispatch."],
      },
      {
        heading: "Pin-code coverage",
        paragraphs: [
          "We deliver across India. If your pin code is not serviceable by Delhivery, checkout will tell you before payment; message us on WhatsApp and we will try to arrange an alternative.",
        ],
      },
      { heading: "GST invoice", paragraphs: ["All prices include 18% GST. A GST invoice is included with every order."] },
      { heading: "Returns shipping", paragraphs: ["Return pickup is free for defective, damaged or wrong items. For other returns, see our Refund & Exchange Policy."] },
      { heading: "Contact", paragraphs: [`Phone / WhatsApp: ${contact.phoneDisplay} · Email: ${contact.email}`] },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How WMart collects, uses and protects your personal data.",
    sections: [
      {
        paragraphs: [
          `This Privacy Policy explains how ${business.legalName} ("WMart", "we", "us"), ${contact.addressLines.join(", ")}, collects and uses your personal data when you visit or buy from the WMart website. We process personal data in line with the Digital Personal Data Protection Act, 2023 and other applicable Indian law.`,
        ],
      },
      {
        heading: "1. Data we collect",
        bullets: [
          "Order and account details: name, phone number, email, billing and delivery address, and order history.",
          "Payment details: handled directly by our payment partner PayU. We do not see or store your full card or bank details.",
          "Messages: what you send us by WhatsApp, email, phone or the contact form, such as your laptop model or part number.",
          "Device and usage data: IP address, browser and pages viewed, collected through cookies and server logs.",
        ],
      },
      {
        heading: "2. How we use it",
        bullets: [
          "To process, ship and support your orders, including returns and warranty claims.",
          "To issue GST invoices and meet tax and legal obligations.",
          "To answer your questions and confirm product compatibility.",
          "To prevent fraud, including verifying Cash on Delivery orders.",
          "To keep the website working and improve it.",
          "To send order updates and, if you opt in, offers. You can opt out of marketing at any time.",
        ],
      },
      {
        heading: "3. Who we share it with",
        paragraphs: ["We share only what is needed with:"],
        bullets: [
          "Our website hosting and database providers, which store the site and your orders securely.",
          "PayU, which processes online payments.",
          "Delhivery, for delivery and returns.",
          "WhatsApp (Meta), when you choose to contact us there.",
          "Government or law-enforcement authorities when required by law.",
        ],
      },
      { paragraphs: ["We do not sell your personal data."] },
      {
        heading: "4. Cookies",
        paragraphs: [
          "We use cookies that are needed for the website to work, such as keeping your cart and signing you in. You can block or delete cookies in your browser settings, but blocking them may stop the cart and checkout from working.",
        ],
      },
      {
        heading: "5. How long we keep it",
        paragraphs: ["We keep order and invoice records for as long as tax law requires (generally 8 years). Other data is kept only as long as needed for the purposes above, then deleted."],
      },
      {
        heading: "6. Your rights",
        paragraphs: [
          `You can ask us to access, correct or erase your personal data, withdraw consent for marketing, or nominate someone to exercise your rights. Email ${contact.email} from the address on your order; we will respond within 30 days.`,
        ],
      },
      { heading: "7. Security", paragraphs: ["Our website uses encrypted connections (HTTPS), and access to customer data is limited to staff who need it to serve you."] },
      { heading: "8. Children", paragraphs: ["The website is not intended for children under 18, and we do not knowingly collect their data."] },
      { heading: "9. Changes", paragraphs: ["We may update this policy; the latest version is always published on this page."] },
      { heading: "10. Grievance Officer", paragraphs: [`Grievance Officer, ${business.legalName}`, contact.addressLines.join(", "), `Email: ${contact.email} · Phone: ${contact.phoneDisplay}`, business.supportHours] },
    ],
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    description: "The terms that apply when you use the WMart website and buy from us.",
    sections: [
      {
        heading: "1. About these terms",
        paragraphs: [
          `These Terms & Conditions govern your use of the WMart website (the "Site") and any purchase made on it. The Site is operated by ${business.legalName} ("WMart", "we", "us"), ${contact.addressLines.join(", ")}. By using the Site or placing an order you agree to these terms.`,
          "WMart is an independent Indian retailer and is not affiliated with Walmart Inc. or any of its subsidiaries.",
        ],
      },
      { heading: "2. Who can buy", paragraphs: ["You may buy from the Site as an individual or on behalf of a business."] },
      {
        heading: "3. Products and compatibility",
        paragraphs: [
          "We sell laptop batteries, adapters, chargers, power cables and accessories. Each product page lists the part numbers and laptop models it fits. Products are labelled either as genuine OEM parts or as compatible parts made by third-party manufacturers. Brand names such as HP, Dell, Lenovo, Asus, Acer and Apple are trademarks of their respective owners and are used only to describe compatibility.",
          "Please check the part number on your existing battery or charger before ordering. If you are unsure, contact us and we will confirm compatibility.",
        ],
      },
      {
        heading: "4. Prices and payment",
        paragraphs: [
          "All prices are in Indian Rupees and include 18% GST. Shipping is free. We accept UPI, debit and credit cards, net banking and wallets through PayU, and Cash on Delivery (where available). We do not store your card details.",
          "If a product is listed at an obviously incorrect price due to an error, we may cancel the order and refund any amount paid in full.",
        ],
      },
      {
        heading: "5. Orders",
        paragraphs: [
          "An order is confirmed when you receive our order confirmation. We may cancel an order if the product is out of stock, the delivery address is not serviceable, or we cannot verify a COD order; in that case any payment is refunded in full.",
        ],
      },
      {
        heading: "6. Shipping, returns and warranty",
        paragraphs: [
          `Shipping, returns, refunds and warranty are governed by our Shipping Policy and Refund & Exchange Policy, which form part of these terms. In short: free shipping, ${days}-day replacement or refund for defective or wrong items with free pickup, and a replacement warranty of ${business.warrantyMonthsOriginal} months on genuine OEM parts and ${business.warrantyMonthsCompatible} months on compatible parts.`,
        ],
      },
      {
        heading: "7. Safe use of batteries and chargers",
        paragraphs: [
          "Use batteries and adapters only with the devices listed as compatible. Do not puncture, crush, heat or short-circuit batteries, and stop using any battery that swells, overheats or leaks. We are not responsible for damage caused by misuse, incompatible devices or unauthorised repair.",
        ],
      },
      {
        heading: "8. Your account and conduct",
        paragraphs: [
          "You are responsible for keeping your account details confidential and for activity under your account. You agree not to misuse the Site, including by attempting to gain unauthorised access, posting unlawful content or placing fraudulent orders. We may suspend accounts that breach these terms.",
        ],
      },
      {
        heading: "9. Content and intellectual property",
        paragraphs: [`Text, images, logos and design on the Site belong to ${business.legalName} or its licensors and may not be copied for commercial use without permission.`],
      },
      {
        heading: "10. Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, our total liability for any order is limited to the amount you paid for that order. Nothing in these terms limits your rights under the Consumer Protection Act, 2019 or other applicable Indian law.",
        ],
      },
      { heading: "11. Privacy", paragraphs: ["We handle your personal data as described in our Privacy Policy."] },
      {
        heading: "12. Governing law and disputes",
        paragraphs: [
          "These terms are governed by the laws of India. Subject to your rights as a consumer, the courts at Ahmedabad, Gujarat have jurisdiction over any dispute. Please contact us first – most issues are resolved quickly by our support team.",
        ],
      },
      { heading: "13. Changes", paragraphs: ["We may update these terms from time to time. The version published on this page at the time of your order applies to that order."] },
      { heading: "14. Contact and grievances", paragraphs: contactLines },
    ],
  },
];

export function getPolicy(slug: string) {
  return policies.find((p) => p.slug === slug);
}
