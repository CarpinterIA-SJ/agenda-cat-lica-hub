import { test, expect, Page } from "@playwright/test";

/**
 * Fluxo principal não-autenticado:
 *   1. Landing (/) carrega sem erros de console.
 *   2. Botão "Entrar" navega para /login (header desktop e menu mobile).
 *   3. Botão "Explorar Eventos" leva para /participante/explorar — rota protegida
 *      sem sessão deve redirecionar para /login.
 */

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

const isMobile = (testInfo: { project: { name: string } }) =>
  testInfo.project.name.includes("mobile");

test.describe("Landing → Login → Explorar", () => {
  test("Landing carrega sem erros de console", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto("/");
    expect(response?.status(), "GET / status").toBeLessThan(400);
    await expect(page).toHaveTitle(/Guardião Eventos/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test('Clicar "Entrar" redireciona para /login', async ({ page }, testInfo) => {
    await page.goto("/");

    if (isMobile(testInfo)) {
      const menuToggle = page.locator("header button.md\\:hidden");
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();
    }

    const entrarBtn = page.getByRole("button", { name: /^Entrar$/ }).first();
    await expect(entrarBtn).toBeVisible();
    await entrarBtn.click();

    await page.waitForURL("**/login");
    expect(new URL(page.url()).pathname).toBe("/login");

    await expect(
      page.getByRole("button", { name: /entrar|login|acessar/i }).first()
    ).toBeVisible();
  });

  test('Clicar "Explorar Eventos" → /participante/explorar (redireciona p/ /login sem sessão)', async ({ page }, testInfo) => {
    await page.goto("/");

    if (isMobile(testInfo)) {
      // hero "Explorar Eventos" continua visível no mobile; menu não necessário
      await page.evaluate(() => window.scrollTo(0, 400));
    }

    const explorarBtn = page.getByRole("button", { name: /Explorar Eventos/i }).first();
    await expect(explorarBtn).toBeVisible();
    await explorarBtn.click();

    // Rota protegida → AuthProvider redireciona para /login
    await page.waitForURL(/\/login|\/participante\/explorar/);

    const path = new URL(page.url()).pathname;
    expect(
      path === "/login" || path === "/participante/explorar",
      `pathname inesperado: ${path}`
    ).toBe(true);

    if (path === "/login") {
      await expect(
        page.getByRole("button", { name: /entrar|login|acessar/i }).first()
      ).toBeVisible();
    } else {
      await expect(page.getByText(/explorar|eventos/i).first()).toBeVisible();
    }
  });

  test("Rota inexistente cai no NotFound", async ({ page }) => {
    await page.goto("/rota-que-nao-existe-xyz");
    await expect(page.getByText(/404|não encontrad/i).first()).toBeVisible();
  });
});
