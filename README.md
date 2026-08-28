# Alma NDE Angular Material M3 Theme Generator

This project was created by PASCAL to make NDE color customization easier for member institutions without requiring the creation of an entire custom Angular module just to change theme colors.

The tool allows users to select a primary color and optionally customize secondary, tertiary, and neutral colors. It then runs the Angular Material M3 theme generator, compiles the generated SCSS with Sass, and returns a ready-to-use CSS file.

https://pascalsc.org/theme-generator/

---

## Using the Generated Theme in Alma NDE

After generating the theme, place the `customized-theme.css` inside the `[YOUR_VIEW]/assets/css` folder of your Alma customization package.

Then add the following line to your package's `custom.css` file:

```css
@import url("customized-theme.css");
```

Adding the css file this way makes it so your theme styling is in it's own file rather than one large custom.css file.

Deploy the updated customization package normally.


## Theme Colors

At least one color must be provided to generate a theme, so this tool requires a **Primary** color.

The Angular Material M3 theme generator uses the colors you provide as seed colors when building the final theme. If you leave the optional color fields disabled, Angular Material will automatically generate appropriate secondary, tertiary, and neutral palettes based on the colors you provided.

In short: you only need to choose a Primary color. The additional colors simply give you more control over the generated theme.

---

## Dev Notes

### `server.js` 

Runs the Express application and handles theme generation requests.

It:

1. Validates submitted color values.
2. Creates a temporary working directory.
3. Runs the Angular Material M3 theme schematic.
4. Copies the SCSS wrapper template.
5. Compiles the theme with Sass.
6. Returns the generated CSS to the browser.
7. Removes the temporary files.

### `public/index.html`

Contains the complete browser interface. Later on another page might be added on for easy additions like those found here:

- https://flvc.libguides.com/nde_mixpanel_implementation/css

### `templates/_customized-theme.scss`

Wraps the generated Material theme and produces the CSS used by Alma NDE.

Example:

```scss
@use '@angular/material' as mat;
@use 'm3-theme' as m3-theme;

.custom-nde-theme {
    @include mat.all-component-colors(
        m3-theme.$light-theme
    );

    @include mat.system-level-colors(
        m3-theme.$light-theme
    );
}
```

### `work/`

Used for temporary theme generation directories.

Each request receives its own unique directory, which is deleted when generation is complete.

---

## Angular Material Theme Generation

The server effectively runs a command similar to:

```bash
ng generate @angular/material:m3-theme \
    --primary-color "#3598c9" \
    --theme-types both \
    --use-system-variables \
    --interactive false
```

Optional arguments are only included when the user explicitly selects those colors.

For example:

```bash
--secondary-color "#123456"
--tertiary-color "#abcdef"
--neutral-color "#888888"
```

If an optional value is not selected, that command-line argument is omitted entirely.

This is different from supplying white (`#ffffff`) as a color.

---

## Sass Compilation

After Angular Material generates `m3-theme.scss`, Sass compiles the custom wrapper into CSS.

The equivalent command is:

```bash
sass \
    --load-path=node_modules \
    _customized-theme.scss \
    customized-theme.css \
    --style=compressed \
    --no-source-map
```

The resulting CSS contains Angular Material component variables and Material system color variables such as:

```css
--sys-primary
--sys-primary-container
--sys-secondary
--sys-tertiary
--sys-surface
--sys-background
```

---
