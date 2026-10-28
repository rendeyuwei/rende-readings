export const categoryNames = [
  'Grok Bot',
  'Agent 工作流',
  '代码评审',
  '个人成长',
  '设计系统',
] as const;

export type CategoryName = (typeof categoryNames)[number];

const slugByName: Record<CategoryName, string> = {
  'Grok Bot': 'grok-bot',
  'Agent 工作流': 'agent-workflow',
  代码评审: 'code-review',
  个人成长: 'personal-growth',
  设计系统: 'design-system',
};

export const categories = categoryNames.map((name) => ({
  name,
  slug: slugByName[name],
}));

export function categorySlug(name: CategoryName): string {
  return slugByName[name];
}
