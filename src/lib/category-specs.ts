export interface SpecFieldDef {
  key: string;
  label: string;
  placeholder: string;
  defaultSuggestions?: string[];
}

export interface CategorySpecConfig {
  title: string;
  description: string;
  fields: SpecFieldDef[];
}

const SPEC_TEMPLATES: Record<string, CategorySpecConfig> = {
  battery: {
    title: "Battery Technical Specifications",
    description: "Provide voltage, capacity, and cell configuration for this laptop battery.",
    fields: [
      {
        key: "voltage",
        label: "Voltage",
        placeholder: "e.g. 14.8V, 11.4V, 15.2V",
        defaultSuggestions: ["14.8V", "11.4V", "11.1V", "15.2V", "14.4V", "7.6V"],
      },
      {
        key: "capacity",
        label: "Capacity / Rating",
        placeholder: "e.g. 41Wh / 2600mAh, 52Wh, 68Wh",
        defaultSuggestions: ["41Wh / 2600mAh", "45Wh", "52Wh", "68Wh", "86Wh", "4400mAh"],
      },
      {
        key: "cells",
        label: "Cell Count",
        placeholder: "e.g. 4 Cell Li-ion, 3 Cell, 6 Cell",
        defaultSuggestions: ["4 Cell Li-ion", "3 Cell Li-ion", "6 Cell Li-ion", "2 Cell"],
      },
      {
        key: "batteryType",
        label: "Battery Chemistry",
        placeholder: "e.g. Lithium-Ion, Lithium-Polymer",
        defaultSuggestions: ["Lithium-Ion", "Lithium-Polymer"],
      },
    ],
  },
  adapter: {
    title: "Charger / Adapter Technical Specifications",
    description: "Provide output wattage, voltage, pin connector dimensions, and input ratings.",
    fields: [
      {
        key: "wattage",
        label: "Output Power (Wattage)",
        placeholder: "e.g. 65W, 90W, 45W, 130W, 140W",
        defaultSuggestions: ["45W", "65W", "90W", "130W", "140W", "180W", "240W"],
      },
      {
        key: "output",
        label: "Output Voltage & Amperage",
        placeholder: "e.g. 19.5V - 3.34A, 20V - 3.25A, 19V - 4.74A",
        defaultSuggestions: [
          "19.5V - 3.34A (65W)",
          "19.5V - 4.62A (90W)",
          "20V - 3.25A (65W)",
          "19V - 2.37A (45W)",
          "19.5V - 2.31A (45W)",
          "20V - 5A / 100W Type-C",
        ],
      },
      {
        key: "connector",
        label: "Connector Pin / Tip Size",
        placeholder: "e.g. 4.5mm x 3.0mm Blue Pin, USB Type-C, 7.4mm x 5.0mm",
        defaultSuggestions: [
          "4.5mm x 3.0mm (Blue Pin)",
          "USB Type-C",
          "7.4mm x 5.0mm (Big Barrel with Center Pin)",
          "5.5mm x 2.5mm",
          "4.0mm x 1.7mm",
          "Square Tip (Lenovo)",
          "Magnetic Tip (Apple MagSafe)",
        ],
      },
      {
        key: "input",
        label: "Input Rating",
        placeholder: "e.g. 100-240V ~ 50-60Hz",
        defaultSuggestions: ["100-240V ~ 50-60Hz 1.5A", "100-240V ~ 50-60Hz 2.0A"],
      },
    ],
  },
  screen: {
    title: "Screen / Display Panel Technical Specifications",
    description: "Specify screen dimensions, resolution, connector pin count, and refresh rate.",
    fields: [
      {
        key: "screenSize",
        label: "Screen Diagonal Size",
        placeholder: "e.g. 15.6 inch, 14.0 inch, 13.3 inch, 16.0 inch",
        defaultSuggestions: ["15.6 inch", "14.0 inch", "13.3 inch", "16.0 inch", "17.3 inch", "11.6 inch"],
      },
      {
        key: "resolution",
        label: "Resolution & Panel Type",
        placeholder: "e.g. 1920x1080 FHD IPS, 1366x768 HD, 2560x1440 2K OLED",
        defaultSuggestions: [
          "1920x1080 FHD IPS",
          "1366x768 HD",
          "1920x1200 FHD+ 16:10",
          "2560x1440 2K QHD",
          "2880x1800 2.8K OLED",
          "3840x2160 4K UHD",
        ],
      },
      {
        key: "connectorPins",
        label: "Connector Pin Count",
        placeholder: "e.g. 30 Pin eDP, 40 Pin eDP, 40 Pin QHD",
        defaultSuggestions: ["30 Pin eDP (Bottom Right)", "40 Pin eDP", "40 Pin QHD / 144Hz", "30 Pin Touch"],
      },
      {
        key: "refreshRate",
        label: "Refresh Rate",
        placeholder: "e.g. 60Hz, 120Hz, 144Hz, 165Hz",
        defaultSuggestions: ["60Hz", "120Hz", "144Hz", "165Hz", "240Hz"],
      },
      {
        key: "surface",
        label: "Surface Finish",
        placeholder: "e.g. Matte / Anti-Glare, Glossy",
        defaultSuggestions: ["Matte (Anti-Glare)", "Glossy", "OLED Glossy"],
      },
    ],
  },
  keyboard: {
    title: "Keyboard Technical Specifications",
    description: "Provide layout, backlight, color, and frame type.",
    fields: [
      {
        key: "layout",
        label: "Language / Key Layout",
        placeholder: "e.g. US English, UK English",
        defaultSuggestions: ["US English (Standard)", "UK English"],
      },
      {
        key: "backlit",
        label: "Backlight Status",
        placeholder: "e.g. Backlit, Non-Backlit, RGB",
        defaultSuggestions: ["Backlit (White)", "Non-Backlit", "RGB Backlit"],
      },
      {
        key: "frame",
        label: "Frame Type",
        placeholder: "e.g. With Frame, Without Frame",
        defaultSuggestions: ["Without Frame", "With Frame (Black)", "With Frame (Silver)"],
      },
      {
        key: "color",
        label: "Key Color",
        placeholder: "e.g. Matte Black, Grey, White",
        defaultSuggestions: ["Matte Black", "Grey", "White", "Silver"],
      },
    ],
  },
  cable: {
    title: "Power Cable Specifications",
    description: "Specify plug type, cable length, and copper wire gauge.",
    fields: [
      {
        key: "cableType",
        label: "Plug / Connector Type",
        placeholder: "e.g. 3-Pin Indian Standard (Type D) to Cloverleaf (C5)",
        defaultSuggestions: [
          "3-Pin Indian to Cloverleaf (C5 Mickey Mouse)",
          "2-Pin Indian to Figure 8 (C7)",
          "3-Pin Indian to C13 (Desktop / Server)",
        ],
      },
      {
        key: "length",
        label: "Cable Length",
        placeholder: "e.g. 1.5 Meter, 1.8 Meter, 3 Meter",
        defaultSuggestions: ["1.5 Meter", "1.8 Meter", "2.0 Meter", "3.0 Meter"],
      },
      {
        key: "wireGauge",
        label: "Conductor Material & Gauge",
        placeholder: "e.g. 100% Pure Copper 3 x 0.75mm²",
        defaultSuggestions: ["100% Pure Copper (3 x 0.75mm²)", "100% Pure Copper (3 x 1.0mm²)"],
      },
    ],
  },
  fan: {
    title: "Cooling Fan Specifications",
    description: "Specify fan connector and electrical ratings.",
    fields: [
      {
        key: "fanConnector",
        label: "Connector Pins",
        placeholder: "e.g. 4-Pin PWM, 3-Pin",
        defaultSuggestions: ["4-Pin PWM", "3-Pin"],
      },
      {
        key: "powerRating",
        label: "Voltage & Current",
        placeholder: "e.g. DC 5V 0.5A, DC 12V",
        defaultSuggestions: ["DC 5V 0.5A", "DC 5V 0.4A", "DC 12V 0.5A"],
      },
    ],
  },
  ram: {
    title: "RAM / Memory Specifications",
    description: "Specify capacity, DDR generation, and frequency.",
    fields: [
      {
        key: "ramCapacity",
        label: "Capacity",
        placeholder: "e.g. 8GB, 16GB, 32GB",
        defaultSuggestions: ["8GB", "16GB", "32GB", "4GB"],
      },
      {
        key: "ramType",
        label: "Memory Generation / Form Factor",
        placeholder: "e.g. DDR4 SODIMM, DDR5 SODIMM",
        defaultSuggestions: ["DDR4 SODIMM", "DDR5 SODIMM", "DDR3L SODIMM"],
      },
      {
        key: "ramSpeed",
        label: "Frequency / Speed",
        placeholder: "e.g. 3200MHz, 4800MHz, 5600MHz",
        defaultSuggestions: ["3200MHz", "4800MHz", "5600MHz", "2666MHz", "2400MHz"],
      },
    ],
  },
};

/**
 * Returns the matching spec configuration for a category based on its slug or name.
 */
export function getCategorySpecConfig(categorySlugOrName: string): CategorySpecConfig {
  const normalized = categorySlugOrName.toLowerCase();

  if (normalized.includes("battery") || normalized.includes("batteries")) {
    return SPEC_TEMPLATES.battery;
  }
  if (
    normalized.includes("adapter") ||
    normalized.includes("charger") ||
    normalized.includes("power-supply")
  ) {
    return SPEC_TEMPLATES.adapter;
  }
  if (
    normalized.includes("screen") ||
    normalized.includes("display") ||
    normalized.includes("panel") ||
    normalized.includes("oled") ||
    normalized.includes("lcd")
  ) {
    return SPEC_TEMPLATES.screen;
  }
  if (normalized.includes("keyboard")) {
    return SPEC_TEMPLATES.keyboard;
  }
  if (normalized.includes("cable") || normalized.includes("cord")) {
    return SPEC_TEMPLATES.cable;
  }
  if (normalized.includes("fan") || normalized.includes("cooling")) {
    return SPEC_TEMPLATES.fan;
  }
  if (normalized.includes("ram") || normalized.includes("memory")) {
    return SPEC_TEMPLATES.ram;
  }

  // Fallback for generic accessories or unknown categories
  return {
    title: "Technical Specifications",
    description: "Add technical specifications and attributes for this product.",
    fields: [
      { key: "voltage", label: "Voltage / Power", placeholder: "e.g. 19.5V or 65W" },
      { key: "dimensions", label: "Dimensions / Size", placeholder: "e.g. 15.6 inch or 4.5mm" },
      { key: "material", label: "Material / Finish", placeholder: "e.g. Matte, ABS Plastic" },
      { key: "warranty", label: "Warranty / Replacement", placeholder: "e.g. 1 Year Replacement Warranty" },
    ],
  };
}

