document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.menu-panel').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
    });
});
