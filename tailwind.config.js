/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // 奶油手账 · 贴纸农场：界面只用这一套语义色，彩色只留给内容（贴纸/元素）
        paper: "#FBF3E7",
        paper2: "#FFFCF6",
        line: "#E7D7C3",
        "line-strong": "#D9C4AC",
        ink: "#3B2E26",
        inksoft: "#7C6B5D",
        inkfaint: "#A9968A",
        berry: "#D35F7B",
        "berry-deep": "#B94C67",
        sage: "#7C9B64",
        "sage-deep": "#64824F",
        butter: "#E7B453",
        "butter-deep": "#C9922F",
        danger: "#C05248",
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Yuanti SC"', '"Microsoft YaHei"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"PingFang SC"', '"Hiragino Sans GB"', '"Yuanti SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        card: "18px",
        control: "12px",
      },
      borderWidth: {
        hair: "1.5px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sticker: "0 2px 0 0 rgba(59,46,38,0.10), 0 12px 26px -16px rgba(59,46,38,0.28)",
        "sticker-sm": "0 1.5px 0 0 rgba(59,46,38,0.10)",
        float: "0 18px 40px -18px rgba(59,46,38,0.35)",
      },
      fontSize: {
        micro: ["11px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.6" }],
        body: ["14px", { lineHeight: "1.65" }],
        section: ["16px", { lineHeight: "1.45" }],
        title: ["20px", { lineHeight: "1.3" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
