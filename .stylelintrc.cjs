module.exports = {
  extends: ["stylelint-config-standard"],
  rules: {
    // Allow Tailwind / PostCSS at-rules and custom project-specific ones
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "custom-variant",
          "theme"
        ]
      }
    ],
    // Allow CSS custom properties and modern color functions
    "property-no-unknown": [
      true,
      {
        "ignoreProperties": ["--*", "oklch"]
      }
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      { "ignorePseudoClasses": ["global", "local"] }
    ],
    "no-descending-specificity": null
  },
  ignoreFiles: ["**/node_modules/**", ".next/**"]
};
