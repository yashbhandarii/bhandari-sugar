/**
 * Shared input helpers for number inputs across the app.
 * - preventScrollChange: blocks mouse-wheel from changing value
 * - handleEnterKey: moves focus to the next focusable element on Enter
 */

export const preventScrollChange = (e) => {
    e.target.blur();
};

export const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const form = e.currentTarget.closest('form') || document;
        const focusable = Array.from(
            form.querySelectorAll(
                'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
            )
        ).filter(el => el.tabIndex !== -1);
        const index = focusable.indexOf(e.currentTarget);
        if (index >= 0 && index < focusable.length - 1) {
            focusable[index + 1].focus();
        }
    }
};
