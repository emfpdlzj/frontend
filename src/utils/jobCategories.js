const collectLeafNames = (node) => {
  if (!Array.isArray(node?.children) || !node.children.length) {
    return [node?.name].filter(Boolean);
  }

  return node.children.flatMap(collectLeafNames);
};

export const toJobCategories = (tree) =>
  tree
    .filter((category) => Array.isArray(category.children) && category.children.length)
    .map((category) => ({
      label: category.name,
      groups: category.children
        .map((group) => ({
          label: group.name,
          jobs: collectLeafNames(group)
        }))
        .filter((group) => group.label && group.jobs.length)
    }))
    .filter((category) => category.label && category.groups.length);
