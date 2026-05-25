import { test, expect, Page } from "@playwright/test";

/**
 * Fluxo principal não-autenticado na Landing.
 *
 * Nota sobre o ambiente: em dev, o cliente Supabase cai no mock-client
 * (src/integrations/supabase/mock-client.ts) que SEMPRE devolve uma sessão
 * válida. Portanto, clicar em "Entrar" navega para /login e o useEffect do
 * LoginPage redireciona imediatamente para /role-select. Da mesma forma,
 * "Explorar Eventos" leva a /participante/explorar, que pode cair em
 * /role-select via RoleRoute. Os testes aceitam esses destinos como sucesso.
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

const AUTH_FLOW_URL = /\/(login|role-select)(\?|$)/;
const EXPLORE_FLOW_URL = /\/(login|role-select|participante\/explorar)(\?|$)/;

test.describe("Landing → Login → Explorar", () => {
  test("Landing carrega sem erros de console", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto("/");
    expect(response?.status(), "GET / status").toBeLessThan(400);
    await expect(page).toHaveTitle(/Guardião Eventos/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    // Ignora apenas erros de favicon ausente em dev.
    const real = errors.filter((e) => !/favicon|404/i.test(e));
    expect(real, real.join("\n")).toEqual([]);
  });

  test('Clicar "Entrar" (ou "Sair") inicia fluxo de autenticação', async ({ page }, testInfo) => {
    await page.goto("/");

    if (isMobile(testInfo)) {
      const menuToggle = page.locator("header button.md\\:hidden").first();
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();
    }

    // Mock-client sempre devolve sessão default → landing renderiza "Sair" no header.
    // Quando deslogado de verdade, mostra "Entrar". Ambos navegam para o fluxo de auth.
    const entrarBtn = page.getByRole("button", { name: /^Entrar$/ });
    const sairBtn   = page.getByRole("button", { name: /^Sair( e voltar ao login)?$/ });
    const authBtn   = entrarBtn.or(sairBtn).first();

    await expect(authBtn).toBeVisible();
    await authBtn.click();

    await expect(page).toHaveURL(AUTH_FLOW_URL, { timeout: 10_000 });

    const loginHeading = page.getByRole("heading", { name: /acesse sua conta|guardião eventos/i });
    const roleHeading  = page.getByRole("heading", { name: /como você deseja acessar/i });
    await expect(loginHeading.or(roleHeading).first()).toBeVisible();
  });

  test('Clicar "Explorar Eventos" navega para área do participante', async ({ page }, testInfo) => {
    await page.goto("/");

    if (isMobile(testInfo)) {
      await page.evaluate(() => window.scrollTo(0, 400));
    }

    const explorarBtn = page.getByRole("button", { name: /Explorar Eventos/i }).first();
    await expect(explorarBtn).toBeVisible();
    await explorarBtn.click();

    // Aceita: chegou à explorar OR redirect de auth (login/role-select).
    await expect(page).toHaveURL(EXPLORE_FLOW_URL, { timeout: 10_000 });

    const exploreHeading = page.getByRole("heading", { name: /eventos|explor/i });
    const loginHeading = page.getByRole("heading", { name: /acesse sua conta|guardião eventos/i });
    const roleHeading = page.getByRole("heading", { name: /como você deseja acessar/i });
    await expect(
      exploreHeading.or(loginHeading).or(roleHeading).first()
    ).toBeVisible();
  });

  test("Rota inexistente cai no NotFound", async ({ page }) => {
    await page.goto("/rota-que-nao-existe-xyz");
    await expect(page.getByText(/404|not found|não encontrad/i).first()).toBeVisible();
  });
});
