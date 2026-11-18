# Preparação do APK e Firebase App Distribution

## Identificador Android

O identificador definido para o aplicativo é `br.com.alertacidadao.mobile`. Use exatamente esse identificador ao registrar o app Android no Firebase. O Firebase não permite trocar o package name depois do registro.

## APK de teste

O arquivo `eas.json` possui o perfil `preview` configurado para gerar APK instalável (distribuição interna). Na pasta `mobile`, execute `eas build --platform android --profile preview`.

## Importante: endereço da API

Antes de distribuir para um professor que esteja fora da sua rede local, altere `src/config/apiConfig.js` para apontar para uma API publicada em endereço HTTPS acessível pela internet. O valor atual é um IP privado de rede local e não estará acessível fora dessa rede. O Firebase App Distribution distribui o APK; ele não hospeda a API nem o banco Oracle.
