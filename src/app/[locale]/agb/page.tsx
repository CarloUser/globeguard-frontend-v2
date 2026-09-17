import {createPendingLegalPage} from '@/components/legal/pending-legal-page';

const {generateMetadata, PendingLegalPage} = createPendingLegalPage({key: 'agb', href: '/agb'});

export {generateMetadata};
export default PendingLegalPage;
