// Upload de archivos a la media library
// IMPORTANTE: los archivos deben estar en la carpeta fixtures/ del proyecto:
//   fixtures/VIDEO_MCD.mp4, fixtures/IMG_MCD.jpg, fixtures/TPL MCD.wgt, fixtures/JSON MCD.json
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';


test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Upload File', () => {
  test('@CP08PP Upload media', async ({ page }) => {
    test.setTimeout(600000); // FFmpeg re-encodes video client-side before upload — can take several minutes
    const fechaFormateada = dateFormatter.datetime(true);
    const folderName = config.uploadFolderName + ' ' + fechaFormateada;

   

    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await loginWithSession(page, config.userName2, config.password);
    await globalPage.waitSpinner();
    await globalPage.clickOnMediaLibraryHeader();

    await mediaLibraryPage.typeSearchMediaInput2(config.fileUploadPath);
    await mediaLibraryPage.findBottomFolder(config.fileUploadPath);

    await mediaLibraryPage.clickAddBtn();
    await mediaLibraryPage.clickCreateFolderBtn();
    await mediaLibraryPage.nameFolder(folderName);
    await mediaLibraryPage.acceptCreateFolderBtn();

    // Video
    await mediaLibraryPage.dropFile(config.fileName1);
    await page.screenshot({ path: 'screenshots/cp08pp-video-upload.png' });
    await mediaLibraryPage.clickOnMedia(config.fileName1);
    await page.screenshot({ path: 'screenshots/cp08pp-video-detail.png' });
    await mediaLibraryPage.checkMediaFormat(config.expectedVideoFormat);
    await mediaLibraryPage.checkMediaDimension(config.expectedVideoDimension);
    await mediaLibraryPage.checkMediaSize(config.expectedVideoSize);
    await mediaLibraryPage.clickCloseBtn();

    // Image
    await mediaLibraryPage.dropFile(config.fileName2);
    await page.screenshot({ path: 'screenshots/cp08pp-image-upload.png' });
    await mediaLibraryPage.clickOnMedia(config.fileName2);
    await page.screenshot({ path: 'screenshots/cp08pp-image-detail.png' });
    await mediaLibraryPage.checkMediaFormat(config.expectedImageFormat);
    await mediaLibraryPage.checkMediaDimension(config.expectedImageDimension);
    await mediaLibraryPage.checkMediaSize(config.expectedImageSize);
    await mediaLibraryPage.clickCloseBtn();

    // Template (.wgt)
    await mediaLibraryPage.dropFile(config.fileName3);
    await page.screenshot({ path: 'screenshots/cp08pp-template-upload.png' });
    await mediaLibraryPage.clickOnMedia(config.fileName3);
    await page.screenshot({ path: 'screenshots/cp08pp-template-detail.png' });
    await mediaLibraryPage.clickCloseBtn();

    // JSON
    await mediaLibraryPage.dropFile(config.fileName4);
    await page.screenshot({ path: 'screenshots/cp08pp-json-upload.png' });
    await mediaLibraryPage.clickOnMedia(config.fileName4);
    await page.screenshot({ path: 'screenshots/cp08pp-json-detail.png' });
  });
});
