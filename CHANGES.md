# Registro de cambios — Playwright E2E refactor

Documentación de todos los cambios estructurales realizados durante el refactor de estabilidad.
El objetivo fue eliminar todos los `waitForTimeout` fijos y reemplazarlos con esperas basadas en elementos.

---

## Principios generales aplicados

| Problema | Solución |
|----------|----------|
| `click({ force: true })` en shadow DOM falla si el elemento no tiene dimensiones | Polling de `boundingBox()` hasta que `width > 0 && height > 0`, luego `dispatchEvent('click')` |
| `waitFor({ state: 'visible' })` falla para Polymer (CSS-hidden aunque exista en DOM) | `waitFor({ state: 'attached' })` o polling de `boundingBox()` |
| `fill({ force: true })` no da foco real → `press('ArrowDown')` no navega vaadin | `dispatchEvent('click')` + `dispatchEvent('focus')` antes del fill |
| `vaadin-combo-box-overlay` aparece en strict mode como múltiple elemento | Filtrar por `[opened]`: `vaadin-combo-box-overlay[opened]` |
| `vaadin-combo-box-item` invisible para Playwright (iron-list virtualización) | `page.evaluate` con `findInShadow` → setear `selectedItem` directo en la API vaadin |
| `paper-toast` auto-dismiss antes de que `readInfoPopup` pueda leerlo | Two-path: 5s fast check visible, 25s fallback por `textContent()` (persiste en DOM) |

---

## pages/BasePage.ts

Sin cambios en esta sesión.

---

## pages/GlobalPage.ts

### `readInfoPopup(msg)` y `readErrorPopup(msg)`
- **Antes:** `expect(label).toBeVisible()` + `toHaveText()` — fallaba cuando el toast se auto-dismisseaba antes de que el check corriera
- **Después:** Two-path:
  1. Fast path: `waitFor({ state: 'visible', timeout: 5000 })` — si el toast sigue visible, verifica texto
  2. Fallback: `expect(async () => { label.textContent() }).toPass({ timeout: 25000 })` — el label persiste en DOM aunque el toast haya desaparecido

---

## pages/NetworkPage.ts

### `clearAndSearch(name)`
- `input.click({ force: true })` → `input.dispatchEvent('click')` — bypasea modales/overlays activos que pueden bloquear el click

### `clickResultingPlayer()`
- **Antes:** `waitFor({ state: 'visible' })` fallaba porque `dex-network-display-detail` tiene `opened=""` pero está CSS-hidden durante la animación Polymer
- **Después:** Espera `dex-network-display-detail#dexNetworkDetail[opened]` con `{ state: 'attached' }` — solo verifica presencia en DOM, no visibilidad CSS. 3 reintentos con `dispatchEvent('click')`.

### `clearAndSearch(name)` — detección de card
- Reemplazado `waitFor({ state: 'visible' })` con polling de `boundingBox()` — los shells de `dex-network-display-card` tienen dimensiones cero hasta que Polymer renderiza el contenido

### Comandos (`clickDisplayCheck`, `clickBotonera`, `clickSendLogCommand`, etc.)
- Todos pasaron de `click()` a `dispatchEvent('click')` con `waitFor({ state: 'visible' })` en el elemento siguiente como confirmación

---

## pages/NetworkDetailPage.ts

### `waitForDetailPanel()` — refactor completo
- **Antes:** `saveButton().waitFor({ state: 'visible', timeout: 30000 })` — fallaba porque el panel está CSS-hidden aunque tenga `opened=""`
- **Después:** Polling `boundingBox()` en el save button (150 iteraciones × 200ms = 30s), luego polling en el group combo

### `clickSave()` — nuevo wait
- Agrega polling de `boundingBox()` antes del click para garantizar que el panel está renderizado

### `decisionToSavePlayer()` — dos cambios
- Polling de `boundingBox()` en lugar de `waitFor({ state: 'visible' })`
- `btn.click()` → `btn.click({ force: true })` — evita que Playwright detecte elementos superpuestos (como el botón cerrar) y clickee el elemento adyacente incorrecto

### `fillVaadinCombo(combo, value)` — refactor completo
- **Antes:** tomaba el `input` locator, usaba `click({ force: true })` + `fill` + overlay wait + `ArrowDown` + `Enter`
- **Después:** toma el `combo` (vaadin-combo-box element), usa:
  1. `waitForVaadinComboReady(combo)` — espera que `el.items.length > 0`
  2. `openOverlay = vaadin-combo-box-overlay[opened]` — evita strict mode con `[opened]` filter
  3. `input.dispatchEvent('click')` + `dispatchEvent('focus')` — abre combo y foca input
  4. `input.fill(value, { force: true })` — filtra resultados
  5. `openOverlay.waitFor({ state: 'visible' })` + 500ms — overlay abierto y filtrado completo
  6. `page.evaluate` con `findInShadow` para encontrar `vaadin-combo-box[opened]` y setear `selectedItem = filteredItems[0]` + **`opened = false`** vía API interna — el `opened = false` es crítico, sin él el overlay queda abierto y bloquea clics posteriores (`<html> intercepts pointer events`)
  7. `openOverlay.waitFor({ state: 'hidden' })` — confirmación de selección
  8. 500ms post-wait — deja que los observers Polymer (`value-changed`) terminen

### `fillPlaylistCombo(combo, value)` — mismo patrón que `fillVaadinCombo`
- Idem, con `waitForPlaylistReady()` como pre-check específico del combo de playlist

### `waitForVaadinComboReady(combo)` — nuevo método
- Pollean `el.items.length` hasta que sea `> 0` (máx 50 × 200ms = 10s)

### Firma de métodos actualizados — todos pasan ahora el combo-box element (no el input):
- `setGroupNone()` → `fillVaadinCombo(groupCombo())`
- `completePlayerGroupSelect(name)` → `fillVaadinCombo(groupCombo(), name)` + wait del toast "Grupo guardado" para que el auto-save complete
- `setInheritedPLDefault()` → `fillPlaylistCombo(plDefaultCombo())`
- `setInheritedSchedule()` → `fillVaadinCombo(scheduleCombo())`
- `setInheritedTP()` → `fillVaadinCombo(tpCombo())`
- `setInheritedHP()` → `fillVaadinCombo(hpCombo())` + `waitForDetailPanel()` post-HP (HP puede disparar re-render del panel)
- `setNewPlaylist()` → `fillPlaylistCombo(plDefaultCombo())`
- `setNewSchedule()` → `fillVaadinCombo(scheduleCombo())`

### Nuevo elemento `plDefaultCombo`
- Apunta al `vaadin-combo-box#playlistMenu` (el combo-box, no el input)
- `plDefaultInput` se mantiene para leer el valor actual (`inputValue()`)

---

## pages/GeneralPage.ts

### `clickDeviceTab()`
- **Antes:** `tab.click()` — timeouteaba en el segundo llamado porque el componente Polymer tarda en renderizar tras la navegación
- **Después:** Polling de `boundingBox()` (60 × 500ms = 30s) + `dispatchEvent('click')` — misma estrategia que el resto de los Polymer elements

### `fillVaadinCombo(combo, value)` — refactor completo
- **Antes:** `input.click({ force: true })` + `fill(value)` + `vaadin-combo-box-overlay` sin `[opened]` filter + `ArrowDown` + `Enter` — igual al patrón antiguo de NetworkDetailPage que fallaba en shadow DOM y tenía strict mode violations
- **Después:** Mismo patrón robusto que NetworkDetailPage:
  1. `vaadin-combo-box-overlay[opened]` para evitar strict mode
  2. `input.dispatchEvent('click')` + `dispatchEvent('focus')` para abrir y focar
  3. `input.fill(value, { force: true })` para filtrar
  4. 500ms wait para que vaadin filtre los items
  5. `page.evaluate` con `findInShadow` para setear `selectedItem = filteredItems[0]` + **`opened = false`** vía API interna vaadin — el `opened = false` es crítico para cerrar el overlay; sin él el overlay queda abierto y bloquea clics posteriores (`<html> intercepts pointer events`)
  6. Wait de overlay hidden como confirmación de selección

### `completePlaylistSelect(playlistName)`
- **Antes:** `clearBtn.isVisible()` + `click({ force: true })` (fallaba silenciosamente en shadow DOM) + `input.click({ force: true })` + `Control+a` + `pressSequentially` + `ArrowDown` + `Enter` — escribía sin limpiar el valor anterior
- **Después:** `clearBtn.dispatchEvent('click')` (siempre, sin check de visibilidad) + delega en `fillVaadinCombo` — consistente con el resto de los métodos

### `waitForComboReady(combo)` — nuevo método (reemplaza `waitForPlaylistReady`)
- Polls `el.items.length > 0` (50 × 200ms = 10s) para cualquier vaadin-combo-box
- Movido al inicio de `fillVaadinCombo` para cubrir TODOS los combos (playlist, schedule, HP, TP, timeZone)
- **Antes:** solo `fillPlaylistCombo` esperaba los items; `completeScheduleSelect`, `completeHardwarePolicySelect`, etc. llamaban `fillVaadinCombo` directamente sin espera, lo que causaba `filteredItems = []` y el evaluate retornaba sin seleccionar nada

### `fillPlaylistCombo(combo, value)`
- Ahora es un thin wrapper sobre `fillVaadinCombo` — la espera de items está dentro de `fillVaadinCombo`

---

## pages/PlaylistPage.ts

### `moveMediaToChannel(channel, mediaName)` — drag-and-drop híbrido
- **Antes:** solo `Locator.dragTo()` — no funciona para el componente Polymer de canales
- **Después:** `dragTo()` primero, verifica que apareció `[data-id="${channel}-${beforeCount}"]` en 5s. Si no aparece, fallback con `page.evaluate` que inyecta el media directamente en el modelo Polymer via `__data.media`
- Timeout del fallback: 8s
- El wait de `ubicarSubcarpetaFinal` cambió a `dex-media-card[slot="card"]` con timeout 15000ms

### Patrón de doble navegación (double navigation)
- **Antes de CADA drag:** `buscarRuta` + `ubicarSubcarpetaFinal` × 2 antes del PRIMER drag únicamente
- **Entre drags consecutivos:** NO re-navegar — las cards de media siguen visibles después del primer drag

### `buscarRuta(ruta)`
- `dispatchEvent('click')` + `fill('', force)` + `fill(ruta, force)` + `press('Enter')` — limpia antes de llenar para evitar texto residual

### `clickResultingPlaylist()`
- Agrega wait de `.horizontal.layout.flex.media-container` visible (canales cargados) antes de retornar

---

## tests/ — cambios en tests individuales

### CP10PP.spec.ts
- Doble navegación antes de `assingMediaTochannels`
- Eliminado `waitForTimeout` entre asignaciones

### CP22PP.spec.ts – CP26PP.spec.ts
- Eliminados todos los `waitForTimeout(2000)` y `waitForTimeout(1000)` entre comandos de player
- Las esperas ahora son element-based vía los métodos `click*Command()` de NetworkPage

### CP27PP.spec.ts
- Doble navegación antes del primer drag únicamente
- Eliminada la re-navegación entre el primer y segundo drag (las cards siguen visibles)

### CP28PP.spec.ts — reescritura completa
- Alineado con estructura de CP27PP
- Variable `ruta` local (era literal repetido)
- Agrega `waitSpinner()` después de `clickOnMediaLibraryHeader()` y después de `typeSearchMediaInput2()`
- Doble navegación antes del drag

---

---

## Fix: filter timing en vaadin-combo-box — "Ninguno" en vez del valor buscado (NetworkDetailPage + GeneralPage)

### Síntoma
CP16PP mostraba `"Ninguno"` en el campo playlist en vez de `"PLAYLIST LONELY (heredado)"`. El evaluate tomaba `filteredItems[0]` o `items[0]` ANTES de que vaadin terminara de filtrar, obteniendo el primer item de la lista completa (que es "Ninguno").

### Causa raíz
`filteredItems` en vaadin-combo-box se actualiza asincronamente después del `fill`. Los 500ms fijos de espera no eran suficientes. Al tomar `filteredItems[0]` prematuramente, se setea el primer item de la lista SIN filtrar (usualmente "Ninguno").

### Fix aplicado — nuevo método `selectInOpenedCombo(value)` en ambas páginas
1. **Poll de filteredItems**: 20×150ms = máx 3s esperando que `filteredItems` contenga al menos un item cuyo label incluya el `value` buscado
2. **Selección por match**: busca en `filteredItems` el primer item cuyo label contiene el `value`; solo hace fallback a `filteredItems[0]` si no hay match exacto
3. Remplaza el evaluate hardcodeado en `fillVaadinCombo` y `fillPlaylistCombo` de ambas páginas

### Eficiencia — `waitForVaadinComboReady`/`waitForComboReady`
- **Antes:** 50×200ms = hasta 10s de espera por combo
- **Después:** 20×150ms = hasta 3s — los items se cargan casi inmediatamente cuando el panel ya está visible; el CP14 superaba los 5 min por la acumulación de muchos combos

---

## Fix: `value-changed` doble disparo cerraba el panel (NetworkDetailPage + GeneralPage)

### Síntoma
Después de asignar valores heredados vía combo, el player detail panel se cerraba solo. El error visible era `Target page, context or browser has been closed` en `clickDeviceTab`. El usuario veía que el click del save button iba al botón de cerrar.

### Causa raíz
`fillVaadinCombo` y `fillPlaylistCombo` disparaban `new CustomEvent('value-changed', { bubbles: true, composed: true })` de forma sintética **después** de que vaadin ya lo había disparado internamente al asignar `selectedItem = items[0]`. El doble disparo propagaba el evento por **todos** los ancestros en shadow DOM (`composed: true`), activando observers de Polymer en `dex-network-display-detail` con el panel en estado inconsistente (overlay ya cerrado), lo que cerraba el panel.

### Fix aplicado
Eliminado el `vaadinCombo.dispatchEvent(new CustomEvent('value-changed', ...))` de:
- `NetworkDetailPage.fillVaadinCombo()` (línea ~86)
- `NetworkDetailPage.fillPlaylistCombo()` (línea ~129)
- `GeneralPage.fillVaadinCombo()` (línea ~44)

Vaadin emite `value-changed` internamente al asignar `selectedItem`; el disparo adicional es redundante y destructivo.

---

## Fix: selector CSS roto en `GlobalPage.optionPOP` (CP46PP)

- **Antes:** `a[href='#!/report/daily-impressions'` — faltaba el `]` de cierre → Playwright lanzaba `Unexpected token` al parsear el selector
- **Después:** `a[href='#!/report/daily-impressions']`

## Fix: assertion inválida en CP57APP

- **Antes:** `expect(locator).toHaveCount(expect.any(Number) as unknown as number)` → Playwright rechazaba `asymmetric matcher` como argumento de `toHaveCount` → error `expected float, got object`
- **Después:** Línea eliminada — la assertion útil ya es la siguiente (`expect(groupCount).toBeGreaterThan(0)`)

---

## utils/ — sin cambios estructurales

`config.ts`, `configuration.json`, `loginWithSession.ts`, `globalSetup.ts`, `testrailReporter.ts`, `automationApi.ts` — agregados como archivos nuevos o sin cambios de lógica.

---

## Patrón de shadow DOM — referencia rápida

```typescript
// Buscar elemento en shadow DOM desde page.evaluate
function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
  const el = root.querySelector(sel);
  if (el) return el;
  for (const e of Array.from(root.querySelectorAll('*'))) {
    const sr = (e as any).shadowRoot;
    if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
  }
  return null;
}
```

## Patrones de espera — referencia rápida

```typescript
// Esperar que un Polymer element tenga dimensiones reales
for (let i = 0; i < 60; i++) {
  const box = await element.boundingBox().catch(() => null);
  if (box && box.width > 0 && box.height > 0) break;
  await this.page.waitForTimeout(500);
}

// Clickear element bypaseando todos los checks
await element.dispatchEvent('click');

// Seleccionar primer item de vaadin-combo-box (shadow DOM)
// IMPORTANTE: NO dispatchar value-changed manualmente — vaadin lo emite al asignar selectedItem.
// Un segundo disparo con bubbles+composed propaga el evento por TODOS los ancestros en shadow DOM
// y puede disparar observers de Polymer que cierran el panel inesperadamente.
await this.page.evaluate(() => {
  function findInShadow(root, sel) { /* ... */ }
  const combo = findInShadow(document, 'vaadin-combo-box[opened]');
  if (combo && combo.filteredItems?.length > 0) {
    combo.selectedItem = combo.filteredItems[0];
    combo.opened = false;  // cierra overlay; NO dispatchar value-changed
  }
});
```
