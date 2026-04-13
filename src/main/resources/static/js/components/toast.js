export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;

    const toast = document.createElement('div');
    const colors = type === 'success' 
        ? 'bg-dark-800 border-l-4 border-emerald-500 text-white' 
        : 'bg-dark-800 border-l-4 border-red-500 text-white';
    
    const icon = type === 'success' 
        ? '<i class="ph-fill ph-check-circle text-emerald-500 text-xl"></i>' 
        : '<i class="ph-fill ph-warning-circle text-red-500 text-xl"></i>';

    toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-lg shadow-xl border border-dark-700 toast-enter ${colors}`;
    toast.innerHTML = `<div>${icon}</div><div class="text-sm font-medium">${message}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}