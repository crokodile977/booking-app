const form = document.getElementById('bookingForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value,
    contact: document.getElementById('contact').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    comment: document.getElementById('comment').value
  };
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    alert('Вы успешно записались!');
    form.reset();
  } else {
    alert('Ошибка при записи. Попробуйте снова.');
  }
});