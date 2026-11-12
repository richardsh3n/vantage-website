const form = document.querySelector('.contact-form');
const topic = new URLSearchParams(location.search).get('topic');
const topicField = form.elements.namedItem('topic');
if (Array.from(topicField.options).some(option => option.value === topic)) {
  topicField.value = topic;
}
form.hidden = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const selected = data.get('topic') || '项目洽谈';
  const subject = encodeURIComponent('VANTAGE / ' + selected);
  const body = encodeURIComponent([
    '称呼：' + data.get('name'),
    '联系邮箱：' + data.get('email'),
    '计划时间：' + (data.get('timing') || '待定'),
    '',
    data.get('details'),
  ].join('\n'));
  location.href = `mailto:hello@rfgstudio.com?subject=${subject}&body=${body}`;
});
