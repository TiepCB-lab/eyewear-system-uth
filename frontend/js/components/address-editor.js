/**
 * AddressEditor Component - Handles address creation and editing
 */

import profileService from '../services/profileService.js';

const AddressEditor = {
    overlay: null,
    form: null,
    provinceSelect: null,
    wardSelect: null,
    streetInput: null,
    onSaveSuccess: null,

    init: function(onSaveSuccess) {
        this.onSaveSuccess = onSaveSuccess;
        this.overlay = document.getElementById('address-editor-overlay');
        this.form = document.getElementById('address-editor-form');
        this.provinceSelect = document.getElementById('address-province-select');
        this.wardSelect = document.getElementById('address-ward-select');
        this.streetInput = document.getElementById('address-street-input');

        if (!this.form) return;

        // Province change handler
        this.provinceSelect?.addEventListener('change', () => {
            const pCode = this.provinceSelect.value;
            if (pCode) this.loadWards(pCode);
            else {
                this.wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
                this.wardSelect.disabled = true;
            }
        });

        // Close buttons handlers
        const closeBtns = ['cancel-address-edit', 'cancel-address-edit-x'];
        closeBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => this.close();
        });

        // Character counters
        const setupCounter = (inputId, maxLength) => {
            const input = document.getElementById(inputId);
            const counter = input?.parentElement?.querySelector('.input-char-count');
            if (input && counter) {
                input.addEventListener('input', () => {
                    const length = input.value.length;
                    counter.textContent = `${length}/${maxLength}`;
                    counter.style.color = length > maxLength ? '#f56565' : '#ccc';
                });
            }
        };
        setupCounter('address-label-input', 50);
        setupCounter('address-street-input', 120);

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    open: function(address = null) {
        if (!this.overlay || !this.form) return;

        this.overlay.hidden = false;
        this.form.reset();

        // Reset character counters
        document.querySelectorAll('.input-char-count').forEach(c => {
            const max = c.textContent.split('/')[1];
            c.textContent = `0/${max}`;
            c.style.color = '#ccc';
        });

        const title = document.getElementById('address-editor-title');
        if (address) {
            if (title) title.textContent = 'Edit Address';
            this.form.id.value = address.id;
            this.form.label.value = address.label;
            this.form.phone.value = address.phone;
            this.form.is_default.checked = !!address.is_default;
            
            // Trigger input events to update counters
            document.getElementById('address-label-input')?.dispatchEvent(new Event('input'));
        } else {
            if (title) title.textContent = 'Add New Address';
            this.form.id.value = '';
        }

        this.overlay.classList.add('show');
        this.initAddressSelectors(address);
    },

    close: function() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            setTimeout(() => this.overlay.hidden = true, 300);
        }
    },

    initAddressSelectors: async function(address = null) {
        if (!this.provinceSelect) return;

        this.provinceSelect.innerHTML = '<option value="">Loading Provinces...</option>';
        this.wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
        this.wardSelect.disabled = true;
        this.streetInput.value = '';

        try {
            const response = await fetch('https://provinces.open-api.vn/api/v2/p/');
            const provinces = await response.json();
            
            this.provinceSelect.innerHTML = '<option value="">Select Province/City</option>';
            provinces.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(p => {
                const option = document.createElement('option');
                option.value = p.code;
                option.textContent = p.name;
                this.provinceSelect.appendChild(option);
            });

            if (address) {
                const parts = address.address.split(',').map(s => s.trim());
                if (parts.length >= 3) {
                    this.streetInput.value = parts[0];
                    document.getElementById('address-street-input')?.dispatchEvent(new Event('input'));

                    const wardName = parts[1];
                    const provinceName = parts[2];

                    const provinceOption = Array.from(this.provinceSelect.options).find(opt => opt.text === provinceName);
                    if (provinceOption) {
                        this.provinceSelect.value = provinceOption.value;
                        await this.loadWards(provinceOption.value, wardName);
                    }
                }
            }
        } catch (err) {
            console.error("Province Load Error:", err);
            this.provinceSelect.innerHTML = '<option value="">Error loading provinces</option>';
        }
    },

    loadWards: async function(provinceCode, autoSelectWardName = null) {
        if (!this.wardSelect) return;

        this.wardSelect.innerHTML = '<option value="">Loading Wards...</option>';
        this.wardSelect.disabled = true;

        try {
            const response = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`);
            const wards = await response.json();

            this.wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
            wards.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(w => {
                const option = document.createElement('option');
                option.value = w.code;
                option.textContent = w.name;
                this.wardSelect.appendChild(option);
            });

            if (autoSelectWardName) {
                const wardOption = Array.from(this.wardSelect.options).find(opt => opt.text === autoSelectWardName);
                if (wardOption) this.wardSelect.value = wardOption.value;
            }
            this.wardSelect.disabled = false;
        } catch (err) {
            console.error("Ward Load Error:", err);
            this.wardSelect.innerHTML = '<option value="">Error loading wards</option>';
        }
    },

    handleSubmit: async function(e) {
        e.preventDefault();
        
        const street = this.streetInput.value.trim();
        const ward = this.wardSelect.options[this.wardSelect.selectedIndex].text;
        const province = this.provinceSelect.options[this.provinceSelect.selectedIndex].text;
        
        const fullAddress = `${street}, ${ward}, ${province}`;
        const fullAddressHidden = document.getElementById('address-full-hidden');
        if (fullAddressHidden) fullAddressHidden.value = fullAddress;

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        const id = data.id;
        delete data.id;
        data.is_default = !!data.is_default;
        data.address = fullAddress;

        const loader = await EvelensNotify.loading('Saving address...');
        try {
            if (id) {
                await profileService.updateAddress(id, data);
            } else {
                await profileService.addAddress(data);
            }
            this.close();
            if (this.onSaveSuccess) this.onSaveSuccess();
            await loader.update({
                type: 'success',
                title: 'Saved!',
                desc: 'Your address has been saved successfully.',
                btnText: 'Great'
            });
        } catch (err) {
            await loader.update({
                type: 'error',
                title: 'Error',
                desc: 'Failed to save address: ' + (err.response?.data?.message || err.message),
                btnText: 'Try Again'
            });
        }
    }
};

export default AddressEditor;
