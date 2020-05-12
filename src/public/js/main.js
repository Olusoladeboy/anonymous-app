// var copyTextBtn = document.querySelector('#copyUrl');
// console.log(document.querySelector('#url'))
// document.querySelector('#url').select()

// copyTextBtn.addEventListener('click', function(event) {
//   var copyTextarea = document.querySelector('#url');
//   copyTextarea.select();

//   try {
//     var successful = document.execCommand('copy');
//     var msg = successful ? 'successful' : 'unsuccessful';
//     console.log('Copying text command was ' + msg);
//   } catch (err) {
//     console.log('Oops, unable to copy');
//   }
// });


var clipboard = new ClipboardJS('.btn-url');

clipboard.on('success', function(e) {
    alert('Copied to clipboard')
    console.info('Accion:', e.action);
    console.info('Texto:', e.text);
    console.info('Trigger:', e.trigger);

    e.clearSelection();
});

clipboard.on('error', function(e) {
    console.error('Accion:', e.action);
    console.error('Trigger:', e.trigger);
});
