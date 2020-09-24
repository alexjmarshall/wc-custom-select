class CustomSelect extends HTMLElement {
  constructor() {
    super();

    const template = document.querySelector('template');
    const clone = document.importNode(template.content, true);
    this.attachShadow({ mode: 'open' });         
    this.shadowRoot.appendChild(clone);
  }

  connectedCallback() {
    //move slot options from lightDOM to shadowDOM
    let select = this.shadowRoot.querySelector('select');
    let host = this.shadowRoot.getRootNode().host;
    let options = host.querySelectorAll('option');
    select.append(...options);

    initCustomSelect(select);
  }
}

window.onload = () => {
  customElements.define('custom-select', CustomSelect);
}

function initCustomSelect(select) {
  buildSelect(select);
    
  let customSel = select.parentElement;
  customSel.addEventListener('click', onCustomSelClick);
  customSel.addEventListener('keydown', onCustomSelKeydown);
  document.addEventListener('click', () => hideItemList(customSel));
}

function onCustomSelClick(e) {
  e.stopPropagation();
  toggleSelect(this);
}

function onCustomSelKeydown(e) {
  e.stopPropagation();
  let items = this.querySelector('.select-items');
  
  if(e.keyCode === 13 || e.keyCode === 0 || e.keyCode === 32) { //enter or spacebar
    e.preventDefault();
    onCustomSelClick.call(this, e);

  } else if(e.keyCode === 27) { //escape
    hideItemList(this);

  } else if(e.keyCode === 40 || e.keyCode === 38) { //down or up arrow
    e.preventDefault();

    if(!items.classList.contains('d-none'))
      focusFirstItem(this);

    else if(e.keyCode === 40) //down arrow
      clickNextItem(this, 'down');
      
    else
      clickNextItem(this, 'up');
  }
}

function toggleSelect(customSel) {
  let items = customSel.querySelector('.select-items');

  items.classList.contains('d-none')
    ? showItemList(customSel)
    : hideItemList(customSel);
}

function showItemList(customSel) {
  customSel.setAttribute('aria-expanded', 'true');
  let items = customSel.querySelector('.select-items');
  items.classList.remove('d-none');

  //toggle display of caret icons
  let downCaret = customSel.querySelector('#down-caret');
  downCaret.classList.add('d-none');
  let upCaret = customSel.querySelector('#up-caret');
  upCaret.classList.remove('d-none');
}

function hideItemList(customSel) {
  customSel.setAttribute('aria-expanded', 'false');
  let items = customSel.querySelector('.select-items');
  items.classList.add('d-none');

  //toggle display of caret icons
  let downCaret = customSel.querySelector('#down-caret');
  downCaret.classList.remove('d-none');
  let upCaret = customSel.querySelector('#up-caret');
  upCaret.classList.add('d-none');
}

function buildSelect(select) {
  //clear selected and items from custom select
  let customSel = select.parentElement;
  let selected = customSel.querySelector('.select-selected');
  selected && selected.remove();
  let selectItems = customSel.querySelector('.select-items');
  selectItems && selectItems.remove();

  //create new div for selected item
  selected = document.createElement('div');
  selected.innerHTML = select.options[select.selectedIndex].innerHTML;
  selected.id = 'select-selected';
  selected.classList.add('select-selected');
  customSel.appendChild(selected);
  customSel.setAttribute('aria-labelledby', selected.id);

  //create a new div for the item list
  selectItems = document.createElement('div');
  selectItems.id = 'select-items';
  selectItems.classList.add('select-items');
  selectItems.setAttribute('role', 'listbox');

  //create a new div for each item
  for (i = 0; i < select.length; i++) {
    if(!select.options[i].value) continue; //skip if option has no value

    let item = document.createElement('div');
    let option = select.options[i]
    let value = option.value;

    item.innerHTML = option.text;
    item.dataset.value = value;
    item.id = `item-${value}`;
    item.classList.add('select-item');
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'option');
    
    i === select.selectedIndex
      ? item.setAttribute('aria-selected', true)
      : item.setAttribute('aria-selected', false);

    item.addEventListener('click', onItemClick);
    item.addEventListener('keydown', onItemKeydown);

    //add item to the item list
    selectItems.appendChild(item);
  }
  //add item list to custom select
  customSel.appendChild(selectItems); 
  hideItemList(customSel);
}

function onItemClick(e) {
  e.stopPropagation();

  let clickedItem = this;
  //add aria-selected to this item and remove it from the others
  clickedItem.setAttribute('aria-selected', true);
  otherItems = getElementSiblings(clickedItem);
  for(item of otherItems)
    item.setAttribute('aria-selected', false);

  let customSel = clickedItem.closest('.custom-select');
  customSel.setAttribute('aria-activedescendant', clickedItem.id);

  //update selectedIndex of backing select and text of selected div
  let select = customSel.querySelector('select');
  let selected = customSel.querySelector('.select-selected');
  for (i = 0; i < select.length; i++) {
    if (select.options[i].value === clickedItem.dataset.value) {
      select.selectedIndex = i;
      selected.innerHTML = clickedItem.innerHTML;
      break;
    }
  }

  customSel.click();
  customSel.focus();
}

function getElementSiblings(elm) {
  let sibs = [];
  let sib = elm.parentElement.firstChild;

  while(sib) {
    sib !== elm && sibs.push(sib);
    sib = sib.nextElementSibling;
  }

  return sibs;
}

function onItemKeydown(e) {
  e.stopPropagation();

  let customSel = this.closest('.custom-select');

  if(e.keyCode === 13) { //enter
    e.preventDefault();
    this.click();

  } else if (e.keyCode === 27) { //escape
    customSel.click();
    customSel.focus();

  } else if (e.keyCode === 40) { //down arrow
    e.preventDefault();
    nextItem = this.nextElementSibling;
    nextItem && nextItem.focus();

  } else if (e.keyCode === 38) { //up arrow
    e.preventDefault();
    prevItem = this.previousElementSibling;
    prevItem && prevItem.focus();
  }
}

function focusFirstItem(customSel) {
  let items = customSel.querySelectorAll('.select-item');
  let firstItem = items[0];
  firstItem.focus();
}

function clickNextItem(customSel, direction) {
  let items = customSel.querySelector('.select-items');
  let selectedItem = items.querySelector('[aria-selected=true]');

  //if no option selected yet, select first
  if(!selectedItem) { 
    items.querySelector(':first-child').click();
    customSel.click();

  } else {
    if(direction === 'down' && selectedItem.nextElementSibling) {
      selectedItem 
        ? selectedItem.nextElementSibling.click()
        : items.querySelector(':first-child').click();
      customSel.click();

    } else if(direction === 'up' && selectedItem.previousElementSibling){
      selectedItem.previousElementSibling.click();
      customSel.click();
    }
  }
}