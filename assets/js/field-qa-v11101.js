/* V11.10.1 · Only label redundant compact-header shortcuts; never alter data. */
(function(){'use strict';
  document.querySelectorAll('#app > .mobilebar > button').forEach(button=>{
    if(button.textContent.trim()==='備份')button.classList.add('v11101-duplicate-header');
  });
})();
