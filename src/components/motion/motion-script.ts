/**
 * Roda no <head>, antes da primeira pintura. Liga as revelações de texto
 * (`html[data-motion]`) só quando:
 * - o usuário não pediu reduced-motion, e
 * - o JS da página de fato carrega: se o MotionRoot não marcar
 *   `data-motion-ready` em 4 s, o atributo sai e tudo aparece no estado final.
 *
 * Sem JS, nada fica escondido (o CSS só esconde sob `html[data-motion]`).
 */
export const motionBootScript = `(function(){try{var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.setAttribute("data-motion","");setTimeout(function(){if(!d.hasAttribute("data-motion-ready"))d.removeAttribute("data-motion")},4000)}catch(e){}})();`;
