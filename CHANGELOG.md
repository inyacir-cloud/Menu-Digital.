# Historial de versiones

Registra aquí cada versión guardada del proyecto. Agrega las versiones nuevas
al inicio de la sección **Versiones**, con su número, fecha y una nota breve
de los cambios realizados.

## Versiones

### V 1.1.4 — 26 de octubre de 2026

- Se eliminó la sección desplegable «Información de pago» después de enviar el pedido.
- Se muestra el número de versión actual en la portada y en el pie del menú, actualizado automáticamente desde `package.json`.
- El resumen del paso 4 agrupa los artículos por categoría.

### V 1.012 — 26 de octubre de 2026

- El resumen del paso 4 ahora agrupa los artículos por categoría.

### V 1.020 — prueba revertida — 26 de octubre de 2026

- Se probó una vista previa del ticket digital del pedido, con opciones para compartirlo o descargarlo en PNG y PDF.
- La prueba se revirtió porque el flujo web no puede adjuntar el archivo directamente a WhatsApp sin abrir el selector del sistema y pedir confirmación. En el entorno local HTTP no está disponible la función nativa para compartir archivos, por lo que no cumplía el envío directo esperado.
- Se regresó el contenido de `main` a `v1.011`; las etiquetas Git `v1.020` y `v1.011` se conservan como referencia.

### V 1.011 — 26 de octubre de 2026

- Al cerrar la ficha de una bebida abierta sobre el carrito, se mantiene visible el pedido.
- Al editar desde el resumen y volver al menú para agregar productos, el pedido reabre en el paso 1 y permite volver directamente al resumen sin repetir entrega ni pago.
- Se sincronizó la reapertura del carrito con el historial para evitar perder el primer toque en «Ver pedido» en móvil.

### V 1.010 — 26 de octubre de 2026

- Se rediseñó el pedido en cuatro pasos, con edición rápida de cada sección del resumen.
- Se añadieron imágenes de categoría junto a los productos y una opción para volver al menú sin perder el carrito.
- Se reorganizaron las opciones de entrega y pago, con paneles desplegables y selección de pago reversible.
- Se agregó el pago con terminal y el cálculo del cambio para pagos en efectivo.
- Se mejoró la lectura de los datos de transferencia en teléfonos.
- El mensaje de WhatsApp predeterminado y las plantillas guardadas se envían sin emojis.

### V 1.004 — 25 de octubre de 2026

- Se muestra el logotipo completo de Mercado Pago, con sus letras originales,
  en el selector y en las demás secciones de pago.
- En el selector, la tarjeta de Mercado Pago conserva solo el logotipo y el
  círculo de selección, sin texto duplicado.
- Se mejoraron la selección de métodos de pago, los datos de transferencia y
  las instrucciones para compartir el comprobante.

### V 1.003 — 25 de octubre de 2026

- Se muestra la CLABE agrupada para facilitar su lectura en el carrito y en
  la información de pago posterior al pedido.
- Se simplificó la presentación de los datos de transferencia para evitar
  repetir la CLABE, con un botón de copia integrado y textos más claros.
- Se mejoraron las instrucciones para enviar el comprobante de pago.
- Se renovó la selección de métodos de pago y los datos de transferencia con
  filas copiables para banco, titular, cuenta y CLABE.
- Se reemplazó el icono genérico de Mercado Pago por el logotipo vertical
  `MP1.png` del proyecto en las opciones de pago.
- Se aumentó el tamaño del logotipo de Mercado Pago en el selector y sus
  instrucciones de pago.
- Se quitó el texto duplicado junto al logotipo en las instrucciones de pago.
- Se muestra `MP1.png` completo, conservando el símbolo y las letras
  originales del logotipo.
- En la tarjeta de Mercado Pago del selector se muestran el logotipo completo
  y el círculo de selección, sin texto adicional.

### V 1.002 — 25 de octubre de 2026

- En la pantalla de negocio cerrado, el horario se muestra al desplegar
  **Cerrado por ahora**.
- Se quitó el acceso visible a WhatsApp y el botón visible de administración
  de la portada.
- **Realizar un pago** está disponible tanto si el negocio está abierto como
  cerrado.

### V 1.001 pagos — 25 de octubre de 2026

- Se agregó **Realizar un pago** en la pantalla principal con opciones de
  transferencia y Mercado Pago.
- Se agregó la opción de copiar la CLABE de transferencia.
- Se ajustó el estilo de los botones de menú y pago.
