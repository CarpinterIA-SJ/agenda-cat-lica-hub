export const INITIAL_MOCK_DATA = {
  profiles: [
    { id: "user-1", full_name: "Usuário Local", email: "local@example.com", role: "admin" }
  ],
  organizations: [
    { id: "org-1", name: "Organização Teste", owner_id: "user-1" }
  ],
  projects: [
    { id: "proj-1", name: "Evento de Exemplo", organization_id: "org-1", status: "active", description: "Descrição do evento local" }
  ]
};
