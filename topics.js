const controls = document.querySelector('.topic-controls');
if (controls) {
  const search = controls.querySelector('input');
  const category = controls.querySelector('select');
  const status = controls.querySelector('[role="status"]');
  const groups = Array.from(document.querySelectorAll('.topic-group'), section => ({
    section,
    cards: Array.from(section.querySelectorAll('.topic-card'), card => ({
      card,
      text: card.textContent.toLowerCase(),
    })),
  }));

  function filterTopics() {
    const terms = search.value.trim().toLowerCase().split(/\s+/);
    let count = 0;
    for (const { section, cards } of groups) {
      const inCategory = !category.value || section.dataset.group === category.value;
      let visible = 0;
      for (const { card, text } of cards) {
        card.hidden = !inCategory || !terms.every(term => text.includes(term));
        if (!card.hidden) visible += 1;
      }
      section.hidden = visible === 0;
      count += visible;
    }
    status.textContent = count ? `${count} 个选题` : '没有找到选题，试试换个关键词或栏目。';
  }

  controls.hidden = false;
  search.addEventListener('input', filterTopics);
  category.addEventListener('change', filterTopics);
  filterTopics();

  const selectedTopic = document.getElementById(location.hash.slice(1));
  if (selectedTopic?.matches('.topic-card')) selectedTopic.open = true;
}
